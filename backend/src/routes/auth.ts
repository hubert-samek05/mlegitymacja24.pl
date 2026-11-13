import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../middleware/auditLog';
import { env } from '../config/env';
import { sendEmail } from '../utils/mailer';
import { tplPasswordReset } from '../utils/emailTemplates';

const router = Router();

router.post(
  '/register-holder',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Konto z tym adresem e-mail już istnieje' });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: 'HOLDER',
        firstName,
        lastName,
        holderProfile: { create: {} },
      },
    });

    await recordAuditLog({ userId: user.id, action: 'USER_REGISTERED', entityType: 'User', entityId: user.id });

    const accessToken = signAccessToken({ userId: user.id, role: user.role, companyId: null });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
    });
  })
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordAuditLog({ userId: user.id, companyId: user.companyId, action: 'USER_LOGIN' });

    const accessToken = signAccessToken({ userId: user.id, role: user.role, companyId: user.companyId });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  })
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Token odświeżający nieprawidłowy lub wygasł' });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Token odświeżający jest nieaktywny' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Konto nieaktywne' });
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role, companyId: user.companyId });

    res.json({ accessToken });
  })
);

// Reset hasła — krok 1: wysyłka linku (zawsze 200, aby nie zdradzać istnienia konta)
router.post(
  '/forgot-password',
  [body('email').isEmail()],
  asyncHandler(async (req, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Podaj prawidłowy adres e-mail' });
    const email = String(req.body.email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      // Unieważnij poprzednie tokeny i wystaw nowy (ważny 60 min)
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const tpl = tplPasswordReset(user.firstName, `${env.frontendUrl}/reset-hasla?token=${token}`);
      await sendEmail(user.email, tpl.subject, tpl.html);
    }
    res.json({ ok: true });
  })
);

// Reset hasła — krok 2: ustawienie nowego hasła po tokenie z maila
router.post(
  '/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  asyncHandler(async (req, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Hasło musi mieć min. 8 znaków' });
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: String(req.body.token) },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) {
      return res.status(400).json({ error: 'Link do resetu hasła jest nieprawidłowy lub wygasł — poproś o nowy' });
    }
    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(req.body.password) },
    });
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    // Wyloguj wszystkie aktywne sesje po zmianie hasła
    await prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAuditLog({ userId: record.userId, action: 'PASSWORD_RESET', entityType: 'User', entityId: record.userId });
    res.json({ ok: true });
  })
);

router.post(
  '/logout',
  [body('refreshToken').notEmpty()],
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
    res.json({ success: true });
  })
);

export default router;
