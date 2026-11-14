import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { hashPassword, comparePassword } from '../utils/password';
import { recordAuditLog } from '../middleware/auditLog';
import { assertCanAddStaff } from '../utils/entitlements';
import { sanitizePermissions } from '../utils/permissions';
import { sendEmail } from '../utils/mailer';
import { tplStaffInvited } from '../utils/emailTemplates';

const router = Router();

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        companyId: true, permissions: true, twoFactorEnabled: true, twoFactorSecret: true, phone: true, createdAt: true,
        company: { select: { id: true, name: true, status: true } },
        holderProfile: {
          select: { photoUrl: true, dateOfBirth: true, address: true, city: true, postalCode: true },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie istnieje' });
    }
    const { twoFactorSecret, ...rest } = user;
    res.json({
      ...rest,
      twoFactorMethod: user.twoFactorEnabled ? (twoFactorSecret ? 'TOTP' : 'EMAIL') : null,
    });
  })
);

// Dodanie pracownika firmy - Company Admin
router.post(
  '/company-staff',
  authenticate,
  authorize('COMPANY_ADMIN'),
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await assertCanAddStaff(req.user!.companyId!);
    } catch (err) {
      return res.status(403).json({ error: err instanceof Error ? err.message : 'Nie można dodać pracownika' });
    }

    const { password, firstName, lastName } = req.body;
    const email = String(req.body.email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Konto z tym adresem e-mail już istnieje' });
    }

    const passwordHash = await hashPassword(password);
    const staff = await prisma.user.create({
      data: {
        email, passwordHash, firstName, lastName,
        role: req.body.role === 'COMPANY_ADMIN' ? 'COMPANY_ADMIN' : 'COMPANY_STAFF',
        permissions: sanitizePermissions(req.body.permissions),
        companyId: req.user!.companyId,
      },
    });

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: req.user!.companyId,
      action: 'COMPANY_STAFF_ADDED',
      entityType: 'User',
      entityId: staff.id,
    });

    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId! }, select: { name: true } });
    const invite = tplStaffInvited(firstName, company?.name ?? '', email);
    await sendEmail(email, invite.subject, invite.html).catch(() => undefined);

    res.status(201).json({ id: staff.id, email: staff.email, firstName: staff.firstName, lastName: staff.lastName });
  })
);

router.get(
  '/company-staff',
  authenticate,
  authorize('COMPANY_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const staff = await prisma.user.findMany({
      where: { companyId: req.user!.companyId, role: { in: ['COMPANY_ADMIN', 'COMPANY_STAFF'] } },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, permissions: true, isActive: true, createdAt: true, lastLoginAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(staff);
  })
);

async function findCompanyStaff(req: AuthRequest) {
  return prisma.user.findFirst({
    where: { id: req.params.id, companyId: req.user!.companyId, role: { in: ['COMPANY_ADMIN', 'COMPANY_STAFF'] } },
  });
}

// Edycja pracownika / blokada dostępu - Company Admin
router.patch(
  '/company-staff/:id',
  authenticate,
  authorize('COMPANY_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const member = await findCompanyStaff(req);
    if (!member) return res.status(404).json({ error: 'Nie znaleziono pracownika' });
    const { firstName, lastName, isActive, role, permissions } = req.body;
    if (role !== undefined && role !== member.role) {
      if (!['COMPANY_ADMIN', 'COMPANY_STAFF'].includes(role)) return res.status(400).json({ error: 'Nieprawidłowa rola' });
      if (member.id === req.user!.userId) return res.status(400).json({ error: 'Nie możesz zmienić własnej roli' });
    }
    if (isActive === false && member.id === req.user!.userId) {
      return res.status(400).json({ error: 'Nie możesz zablokować własnego konta' });
    }
    if (isActive === true && !member.isActive) {
      try { await assertCanAddStaff(req.user!.companyId!); } catch (err) {
        return res.status(403).json({ error: err instanceof Error ? err.message : 'Limit kont zespołu' });
      }
    }
    if ((firstName !== undefined && !String(firstName).trim()) || (lastName !== undefined && !String(lastName).trim())) {
      return res.status(400).json({ error: 'Imię i nazwisko nie mogą być puste' });
    }
    const updated = await prisma.user.update({
      where: { id: member.id },
      data: {
        ...(firstName !== undefined && { firstName: String(firstName).trim() }),
        ...(lastName !== undefined && { lastName: String(lastName).trim() }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(role !== undefined && { role }),
        ...(permissions !== undefined && { permissions: sanitizePermissions(permissions) }),
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, permissions: true, isActive: true },
    });
    if (isActive === false) {
      await prisma.refreshToken.updateMany({ where: { userId: member.id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await recordAuditLog({
      userId: req.user!.userId, companyId: req.user!.companyId, action: 'COMPANY_STAFF_UPDATED',
      entityType: 'User', entityId: member.id,
    });
    res.json(updated);
  })
);

// Ustawienie nowego hasła tymczasowego pracownikowi - Company Admin
router.post(
  '/company-staff/:id/reset-password',
  authenticate,
  authorize('COMPANY_ADMIN'),
  [body('password').isLength({ min: 8 })],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Hasło musi mieć co najmniej 8 znaków' });
    const member = await findCompanyStaff(req);
    if (!member) return res.status(404).json({ error: 'Nie znaleziono pracownika' });
    await prisma.user.update({ where: { id: member.id }, data: { passwordHash: await hashPassword(req.body.password) } });
    await prisma.refreshToken.updateMany({ where: { userId: member.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAuditLog({
      userId: req.user!.userId, companyId: req.user!.companyId, action: 'COMPANY_STAFF_PASSWORD_RESET',
      entityType: 'User', entityId: member.id,
    });
    res.json({ ok: true });
  })
);

// Aktualizacja własnego profilu (dane podstawowe + profil absolwenta)
router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { firstName, lastName, phone, dateOfBirth, address, city, postalCode } = req.body;

    if (req.user!.role === 'HOLDER') {
      // Absolwent może edytować wyłącznie dane kontaktowe.
      // Dane tożsamości (imię, nazwisko, data urodzenia, zdjęcie) ustala
      // firma szkoleniowa przy wystawianiu legitymacji — inaczej dokument
      // straciłby wartość weryfikacyjną.
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { ...(phone !== undefined && { phone }) },
      });
      await prisma.holderProfile.upsert({
        where: { userId: req.user!.userId },
        update: {
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(postalCode !== undefined && { postalCode }),
        },
        create: {
          userId: req.user!.userId,
          address: address ?? null,
          city: city ?? null,
          postalCode: postalCode ?? null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(phone !== undefined && { phone }),
        },
      });
    }

    res.json({ ok: true });
  })
);

// Zmiana własnego hasła
router.post(
  '/me/password',
  authenticate,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 8 znaków' });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: 'Obecne hasło jest nieprawidłowe' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    res.json({ ok: true });
  })
);

// Powiadomienia zalogowanego użytkownika
router.get(
  '/me/notifications',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  })
);

// Lista wszystkich kont w systemie - Super Admin
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        company: { select: { id: true, name: true, status: true } },
        holderProfile: { select: { _count: { select: { credentials: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  })
);

// Oznaczenie wszystkich powiadomień jako przeczytane
router.patch(
  '/me/notifications/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, status: 'PENDING' },
      data: { status: 'SENT', sentAt: new Date() },
    });
    res.json({ ok: true });
  })
);

export default router;
