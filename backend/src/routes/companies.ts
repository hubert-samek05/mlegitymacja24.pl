import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/auditLog';
import { env } from '../config/env';
import { sendEmail } from '../utils/mailer';
import { mailSuperAdmins } from '../utils/notify';
import {
  tplAdminNewCompany,
  tplCompanyApproved,
  tplCompanyRegistered,
  tplCompanyRejected,
  tplCompanySuspendedByAdmin,
} from '../utils/emailTemplates';

const router = Router();

// Upload logo firmy - zapisywane w katalogu uploads, serwowanym pod /uploads
const uploadsPath = path.join(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadsPath, { recursive: true });

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsPath,
    filename: (_req, file, cb) => {
      const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[file.mimetype] ?? '.png';
      cb(null, `logo-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Dozwolone formaty logo: PNG, JPG lub WebP'));
  },
});

// Czytelne komunikaty błędów uploadu (za duży plik, zły format)
const logoMiddleware = (req: AuthRequest, res: Response, next: () => void) => {
  logoUpload.single('logo')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'Plik logo jest za duży — maksymalny rozmiar to 10 MB'
        : err instanceof Error ? err.message : 'Nieprawidłowy plik logo';
      return res.status(400).json({ error: msg });
    }
    next();
  });
};

function deleteOldLogo(logoUrl: string | null) {
  if (!logoUrl || !logoUrl.startsWith('/uploads/')) return;
  const filePath = path.join(uploadsPath, path.basename(logoUrl));
  fs.unlink(filePath, () => {});
}

// Rejestracja nowej firmy szkoleniowej (trafia do weryfikacji przez Super Admina)
router.post(
  '/register',
  [
    body('companyName').notEmpty(),
    body('nip').isLength({ min: 10, max: 10 }),
    body('contactEmail').isEmail(),
    body('adminEmail').isEmail(),
    body('adminPassword').isLength({ min: 8 }),
    body('adminFirstName').notEmpty(),
    body('adminLastName').notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      companyName, nip, regon, address, city, postalCode, website,
      contactEmail, contactPhone,
      adminEmail, adminPassword, adminFirstName, adminLastName,
    } = req.body;

    const existingCompany = await prisma.company.findUnique({ where: { nip } });
    if (existingCompany) {
      return res.status(409).json({ error: 'Firma z tym numerem NIP jest już zarejestrowana' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'Konto z tym adresem e-mail już istnieje' });
    }

    const passwordHash = await hashPassword(adminPassword);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          nip,
          regon,
          address,
          city,
          postalCode,
          website,
          contactEmail,
          contactPhone,
          status: 'PENDING_VERIFICATION',
        },
      });

      const adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'COMPANY_ADMIN',
          firstName: adminFirstName,
          lastName: adminLastName,
          companyId: company.id,
        },
      });

      return { company, adminUser };
    });

    await sendEmail(
      adminEmail,
      tplCompanyRegistered(companyName, adminFirstName).subject,
      tplCompanyRegistered(companyName, adminFirstName).html
    );
    await mailSuperAdmins(tplAdminNewCompany(companyName, nip));

    await recordAuditLog({
      userId: result.adminUser.id,
      companyId: result.company.id,
      action: 'COMPANY_REGISTERED',
      entityType: 'Company',
      entityId: result.company.id,
    });

    res.status(201).json({
      message: 'Firma została zarejestrowana i oczekuje na weryfikację przez administratora platformy',
      companyId: result.company.id,
    });
  })
);

// Publiczne wyszukiwanie danych firmy po NIP — Biała Lista podatników VAT (MF)
router.get(
  '/nip-lookup',
  asyncHandler(async (req, res) => {
    const nip = String(req.query.nip ?? '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(nip)) {
      return res.status(400).json({ error: 'Podaj prawidłowy 10-cyfrowy NIP' });
    }
    const date = new Date().toISOString().slice(0, 10);
    try {
      const r = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`);
      if (r.status === 404 || r.status === 400) {
        return res.status(404).json({ error: 'Nie znaleziono podmiotu o tym numerze NIP' });
      }
      if (!r.ok) {
        return res.status(502).json({ error: 'Usługa weryfikacji NIP jest chwilowo niedostępna — uzupełnij dane ręcznie' });
      }
      const data: any = await r.json();
      const s = data?.result?.subject;
      if (!s) {
        return res.status(404).json({ error: 'Nie znaleziono podmiotu o tym numerze NIP' });
      }
      const rawAddress: string = s.workingAddress || s.residenceAddress || '';
      const m = rawAddress.match(/^(.*?),?\s*(\d{2}-\d{3})\s+(.+)$/);
      res.json({
        name: s.name || '',
        regon: s.regon || '',
        krs: s.krs || '',
        nip: s.nip || nip,
        address: m?.[1]?.trim().replace(/,\s*$/, '') || rawAddress,
        postalCode: m?.[2] || '',
        city: m?.[3]?.trim() || '',
        vatStatus: s.statusVat || '',
      });
    } catch (err) {
      return res.status(502).json({ error: 'Usługa weryfikacji NIP jest chwilowo niedostępna — uzupełnij dane ręcznie' });
    }
  })
);

// Dane własnej firmy - administrator firmy i pracownik
router.get(
  '/me',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  asyncHandler(async (req: AuthRequest, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId! },
      include: {
        subscription: { include: { plan: true, payments: { orderBy: { createdAt: 'desc' } } } },
        _count: { select: { credentials: true, users: true } },
      },
    });
    if (!company) {
      return res.status(404).json({ error: 'Nie znaleziono firmy' });
    }
    res.json(company);
  })
);

// Aktualizacja danych kontaktowych własnej firmy - Company Admin
// Po weryfikacji (ACTIVE/SUSPENDED) dane rejestrowe są zablokowane -
// stanowią podstawę identyfikacji wystawcy na legitymacjach i w weryfikacji
router.patch(
  '/me',
  authenticate,
  authorize('COMPANY_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { regon, address, city, postalCode, website, contactEmail, contactPhone } = req.body;

    const current = await prisma.company.findUnique({
      where: { id: req.user!.companyId! },
      select: { status: true },
    });
    if (current?.status === 'ACTIVE' || current?.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Dane firmy są zablokowane po weryfikacji — zmiana wymaga kontaktu z administratorem platformy',
      });
    }

    if (contactEmail !== undefined && contactEmail !== null && contactEmail !== '' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: 'Nieprawidłowy adres e-mail' });
    }

    const company = await prisma.company.update({
      where: { id: req.user!.companyId! },
      data: {
        ...(regon !== undefined && { regon }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(website !== undefined && { website }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
      },
    });

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: company.id,
      action: 'COMPANY_PROFILE_UPDATED',
      entityType: 'Company',
      entityId: company.id,
    });

    res.json(company);
  })
);

// Upload logo firmy - Company Admin (PNG/JPG/WebP, max 10 MB)
router.post(
  '/me/logo',
  authenticate,
  authorize('COMPANY_ADMIN'),
  logoMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku logo' });
    }
    const existing = await prisma.company.findUnique({
      where: { id: req.user!.companyId! },
      select: { logoUrl: true },
    });
    const logoUrl = `/uploads/${req.file.filename}`;
    const company = await prisma.company.update({
      where: { id: req.user!.companyId! },
      data: { logoUrl },
    });
    deleteOldLogo(existing?.logoUrl ?? null);

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: company.id,
      action: 'COMPANY_LOGO_UPDATED',
      entityType: 'Company',
      entityId: company.id,
    });

    res.json({ logoUrl: company.logoUrl });
  })
);

// Usunięcie logo firmy - Company Admin
router.delete(
  '/me/logo',
  authenticate,
  authorize('COMPANY_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.company.findUnique({
      where: { id: req.user!.companyId! },
      select: { logoUrl: true },
    });
    await prisma.company.update({
      where: { id: req.user!.companyId! },
      data: { logoUrl: null },
    });
    deleteOldLogo(existing?.logoUrl ?? null);
    res.json({ logoUrl: null });
  })
);

// Lista dostępnych planów subskrypcji
router.get(
  '/subscription-plans',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  asyncHandler(async (req, res) => {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceCents: 'asc' },
    });
    res.json(plans);
  })
);

// Lista firm - tylko Super Admin
router.get(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { credentials: true, users: true } } },
    });
    res.json(companies);
  })
);

// Szczegóły firmy
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== id) {
      return res.status(403).json({ error: 'Brak uprawnień do tego zasobu' });
    }
    const isSuper = req.user!.role === 'SUPER_ADMIN';
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
            payments: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
        ...(isSuper
          ? {
              users: {
                orderBy: { createdAt: 'asc' },
                select: {
                  id: true, firstName: true, lastName: true, email: true,
                  role: true, isActive: true, lastLoginAt: true, createdAt: true,
                },
              },
              _count: { select: { credentials: true, supportTickets: true, credentialTypeRequests: true } },
            }
          : {}),
      },
    });
    if (!company) {
      return res.status(404).json({ error: 'Nie znaleziono firmy' });
    }
    res.json(company);
  })
);

// Edycja danych firmy - Super Admin (jedyny kanał zmiany po weryfikacji)
router.patch(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { name, nip, regon, address, city, postalCode, website, contactEmail, contactPhone } = req.body;

    if (contactEmail !== undefined && contactEmail !== null && contactEmail !== '' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: 'Nieprawidłowy adres e-mail' });
    }
    if (nip !== undefined && nip !== null && nip !== '' && !/^\d{10}$/.test(String(nip).replace(/[-\s]/g, ''))) {
      return res.status(400).json({ error: 'NIP musi składać się z 10 cyfr' });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name !== undefined && name !== '' && { name }),
        ...(nip !== undefined && nip !== '' && { nip: String(nip).replace(/[-\s]/g, '') }),
        ...(regon !== undefined && { regon }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(website !== undefined && { website }),
        ...(contactEmail !== undefined && contactEmail !== '' && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
      },
    });

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: company.id,
      action: 'COMPANY_DATA_UPDATED_BY_ADMIN',
      entityType: 'Company',
      entityId: company.id,
    });

    res.json(company);
  })
);

// Zatwierdzenie / odrzucenie firmy - Super Admin
router.patch(
  '/:id/status',
  authenticate,
  authorize('SUPER_ADMIN'),
  [body('status').isIn(['ACTIVE', 'REJECTED', 'SUSPENDED', 'PENDING_VERIFICATION'])],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        status,
        verificationNote: note,
        verifiedAt: status === 'ACTIVE' ? new Date() : undefined,
      },
    });

    if (status === 'ACTIVE' && env.trialDays > 0) {
      const existing = await prisma.subscription.findUnique({ where: { companyId: id } });
      const starter = await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { monthlyPriceCents: 'asc' } });
      if (!existing && starter) {
        const end = new Date();
        end.setDate(end.getDate() + env.trialDays);
        await prisma.subscription.create({
          data: { companyId: id, planId: starter.id, status: 'TRIALING', currentPeriodEnd: end },
        });
      }
    }

    // E-mail do administratorów firmy o zmianie statusu zgłoszenia
    const admins = await prisma.user.findMany({
      where: { companyId: id, role: 'COMPANY_ADMIN', isActive: true },
      select: { email: true, firstName: true },
    });
    for (const a of admins) {
      const tpl =
        status === 'ACTIVE'
          ? tplCompanyApproved(company.name, a.firstName)
          : status === 'REJECTED'
            ? tplCompanyRejected(company.name, a.firstName, company.verificationNote)
            : status === 'SUSPENDED'
              ? tplCompanySuspendedByAdmin(company.name, a.firstName)
              : null;
      if (tpl) await sendEmail(a.email, tpl.subject, tpl.html);
    }

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: company.id,
      action: `COMPANY_STATUS_CHANGED_TO_${status}`,
      entityType: 'Company',
      entityId: company.id,
    });

    res.json(company);
  })
);

export default router;
