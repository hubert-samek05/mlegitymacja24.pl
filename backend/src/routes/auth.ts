import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAuditLog } from '../middleware/auditLog';
import { env } from '../config/env';
import { sendEmail } from '../utils/mailer';
import { tplPasswordReset } from '../utils/emailTemplates';
import { generateTotpSecret, otpauthUrl, verifyTotp } from '../utils/totp';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const TWO_FACTOR_PENDING_TTL = '5m';

interface TwoFactorPendingPayload {
  userId: string;
  purpose: '2fa-pending';
}

function signTwoFactorPending(userId: string): string {
  return jwt.sign({ userId, purpose: '2fa-pending' }, env.jwtSecret, {
    expiresIn: TWO_FACTOR_PENDING_TTL,
  });
}

function verifyTwoFactorPending(token: string): TwoFactorPendingPayload {
  const payload = jwt.verify(token, env.jwtSecret) as TwoFactorPendingPayload;
  if (payload.purpose !== '2fa-pending') throw new Error('bad purpose');
  return payload;
}

async function issueSession(user: { id: string; role: string; companyId: string | null }) {
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
  });
  const refreshToken = signRefreshToken({ userId: user.id });
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
}

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

    // Weryfikacja dwuetapowa — wydajemy token tymczasowy, sesję dopiero po kodzie
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return res.json({
        requiresTwoFactor: true,
        pendingToken: signTwoFactorPending(user.id),
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordAuditLog({ userId: user.id, companyId: user.companyId, action: 'USER_LOGIN' });

    const { accessToken, refreshToken } = await issueSession(user);

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

// Logowanie — krok 2: kod z aplikacji uwierzytelniającej (TOTP)
router.post(
  '/login/2fa',
  [body('pendingToken').notEmpty(), body('code').notEmpty()],
  asyncHandler(async (req, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json({ error: 'Brak kodu weryfikacyjnego' });
    }

    let payload: TwoFactorPendingPayload;
    try {
      payload = verifyTwoFactorPending(String(req.body.pendingToken));
    } catch {
      return res
        .status(401)
        .json({ error: 'Sesja logowania wygasła — zaloguj się ponownie' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(401).json({ error: 'Sesja logowania jest nieprawidłowa' });
    }

    if (!verifyTotp(user.twoFactorSecret, String(req.body.code))) {
      return res.status(401).json({ error: 'Nieprawidłowy kod weryfikacyjny' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordAuditLog({ userId: user.id, companyId: user.companyId, action: 'USER_LOGIN' });

    const { accessToken, refreshToken } = await issueSession(user);

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

// 2FA — krok 1 konfiguracji: wygeneruj sekret i link otpauth:// (QR po stronie frontu)
router.post(
  '/2fa/setup',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje' });
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Weryfikacja dwuetapowa jest już włączona' });
    }

    const secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    res.json({ secret, otpauthUrl: otpauthUrl(user.email, secret) });
  })
);

// 2FA — krok 2 konfiguracji: potwierdź kodem z aplikacji
router.post(
  '/2fa/enable',
  authenticate,
  [body('code').notEmpty()],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json({ error: 'Brak kodu weryfikacyjnego' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.twoFactorSecret) {
      return res
        .status(400)
        .json({ error: 'Najpierw wygeneruj sekret — rozpocznij konfigurację od nowa' });
    }
    if (!verifyTotp(user.twoFactorSecret, String(req.body.code))) {
      return res.status(400).json({ error: 'Nieprawidłowy kod — spróbuj ponownie' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });
    await recordAuditLog({ userId: user.id, action: '2FA_ENABLED', entityType: 'User', entityId: user.id });

    res.json({ ok: true });
  })
);

// 2FA — wyłączenie wymaga hasła i aktualnego kodu
router.post(
  '/2fa/disable',
  authenticate,
  [body('password').notEmpty(), body('code').notEmpty()],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json({ error: 'Podaj hasło i kod weryfikacyjny' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Weryfikacja dwuetapowa nie jest włączona' });
    }
    const validPassword = await comparePassword(String(req.body.password), user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Nieprawidłowe hasło' });
    }
    if (!verifyTotp(user.twoFactorSecret, String(req.body.code))) {
      return res.status(401).json({ error: 'Nieprawidłowy kod weryfikacyjny' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    await recordAuditLog({ userId: user.id, action: '2FA_DISABLED', entityType: 'User', entityId: user.id });

    res.json({ ok: true });
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
