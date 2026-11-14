import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/auditLog';
import { generateCredentialToken } from '../utils/credentialToken';
import { hashPassword } from '../utils/password';
import { assertCanIssue, assertActiveSubscription } from '../utils/entitlements';
import { requirePermission } from '../utils/permissions';
import { sendEmail } from '../utils/mailer';
import { tplCredentialIssuedExisting, tplCredentialIssuedNew } from '../utils/emailTemplates';

function generateTemporaryPassword(): string {
  return crypto.randomBytes(9).toString('base64url');
}

const router = Router();

// Upload zdjęcia absolwenta na legitymację - katalog uploads, serwowany pod /uploads
const uploadsPath = path.join(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadsPath, { recursive: true });

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsPath,
    filename: (_req, file, cb) => {
      const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[file.mimetype] ?? '.jpg';
      cb(null, `holder-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Dozwolone formaty zdjęcia: PNG, JPG lub WebP'));
  },
});

const photoMiddleware = (req: AuthRequest, res: Response, next: () => void) => {
  photoUpload.single('photo')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'Plik zdjęcia jest za duży — maksymalny rozmiar to 10 MB'
        : err instanceof Error ? err.message : 'Nieprawidłowy plik zdjęcia';
      return res.status(400).json({ error: msg });
    }
    next();
  });
};

// Upload zdjęcia na legitymację - zwraca URL do przekazania jako photoUrl przy wystawianiu
router.post(
  '/photo',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('credentials.issue'),
  photoMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku zdjęcia' });
    }
    res.status(201).json({ photoUrl: `/uploads/${req.file.filename}` });
  })
);

function generateCredentialNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ML24-${year}-${random}`;
}

const SECURITY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function generateSecurityCode(): Promise<string> {
  for (;;) {
    const code = Array.from({ length: 16 }, () => SECURITY_CODE_ALPHABET[crypto.randomInt(SECURITY_CODE_ALPHABET.length)]).join('');
    if (!(await prisma.credential.findUnique({ where: { securityCode: code }, select: { id: true } }))) return code;
  }
}

interface IssueInput {
  companyNumber?: string;
  holderEmail: string;
  holderFirstName: string;
  holderLastName: string;
  holderPhone?: string;
  holderDateOfBirth: string;
  holderPlaceOfBirth: string;
  credentialTypeId?: string;
  credentialTypeName?: string;
  issueDate: string;
  expiryDate?: string | null;
  noExpiry?: boolean;
  extraData?: unknown;
  photoUrl?: string;
}

interface IssueResult {
  credential: { id: string; credentialNumber: string; companyNumber: string | null; securityCode: string | null };
  holderAccount: { email: string; temporaryPassword?: string; isNewAccount: boolean };
}

// Wspólna logika wystawiania legitymacji - używana przez POST / oraz POST /bulk
async function issueCredential(
  companyId: string,
  issuedByUserId: string,
  input: IssueInput
): Promise<IssueResult> {
  const {
    companyNumber,
    holderEmail, holderFirstName, holderLastName, holderPhone,
    holderDateOfBirth, holderPlaceOfBirth,
    credentialTypeId, credentialTypeName,
    issueDate, expiryDate, noExpiry, extraData, photoUrl,
  } = input;

  await assertCanIssue(companyId);
  if (!companyNumber?.trim()) {
    throw new Error('Numer legitymacji jest wymagany');
  }
  if (!holderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(holderEmail)) {
    throw new Error('Nieprawidłowy adres e-mail absolwenta');
  }
  if (!holderFirstName?.trim() || !holderLastName?.trim()) {
    throw new Error('Imię i nazwisko absolwenta są wymagane');
  }
  if (!holderDateOfBirth || isNaN(new Date(holderDateOfBirth).getTime())) {
    throw new Error('Data urodzenia absolwenta jest wymagana (format RRRR-MM-DD)');
  }
  if (!holderPlaceOfBirth?.trim()) {
    throw new Error('Miejsce urodzenia absolwenta jest wymagane');
  }
  if (!issueDate || isNaN(new Date(issueDate).getTime())) {
    throw new Error('Nieprawidłowa data wystawienia');
  }

  let credentialType = credentialTypeId
    ? await prisma.credentialType.findUnique({ where: { id: credentialTypeId } })
    : await prisma.credentialType.findFirst({
        where: { name: { equals: credentialTypeName ?? '', mode: 'insensitive' } },
      });
  if (!credentialType || !credentialType.isActive) {
    throw new Error(`Nieprawidłowy typ legitymacji${credentialTypeName ? `: ${credentialTypeName}` : ''}`);
  }

  const dob = new Date(holderDateOfBirth);
  const pob = holderPlaceOfBirth.trim();
  const email = holderEmail.trim().toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email },
    include: { holderProfile: true },
  });

  // Adresy kont firmowych/administracyjnych nie mogą być użyte jako e-mail
  // absolwenta — portfel to osobne konto prywatne.
  if (user && user.role !== 'HOLDER') {
    throw new Error('Ten adres e-mail należy do konta firmowego lub administracyjnego — podaj prywatny adres absolwenta');
  }

  let temporaryPassword: string | null = null;

  if (!user) {
    temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    user = await prisma.user.create({
      data: {
        email,
        phone: holderPhone,
        passwordHash,
        role: 'HOLDER',
        firstName: holderFirstName.trim(),
        lastName: holderLastName.trim(),
        holderProfile: {
          create: { photoUrl, dateOfBirth: dob, placeOfBirth: pob },
        },
      },
      include: { holderProfile: true },
    });
  } else if (!user.holderProfile) {
    await prisma.holderProfile.create({
      data: { userId: user.id, photoUrl, dateOfBirth: dob, placeOfBirth: pob },
    });
    user = await prisma.user.findUnique({ where: { id: user.id }, include: { holderProfile: true } });
  } else if (!user.holderProfile.dateOfBirth || !user.holderProfile.placeOfBirth) {
    // Uzupełniamy brakujące dane tożsamości na istniejącym profilu
    await prisma.holderProfile.update({
      where: { id: user.holderProfile.id },
      data: {
        ...(!user.holderProfile.dateOfBirth && { dateOfBirth: dob }),
        ...(!user.holderProfile.placeOfBirth && { placeOfBirth: pob }),
      },
    });
  }

  const computedExpiry = noExpiry
    ? null
    : expiryDate
      ? new Date(expiryDate)
      : credentialType.defaultValidityMonths
        ? new Date(new Date(issueDate).setMonth(new Date(issueDate).getMonth() + credentialType.defaultValidityMonths))
        : null;

  // Snapshot danych tożsamości na dokumencie - niezmienny nawet po edycji profilu
  const snapshot = {
    holderFirstName: holderFirstName.trim(),
    holderLastName: holderLastName.trim(),
    holderDateOfBirth: dob.toISOString().slice(0, 10),
    holderPlaceOfBirth: pob,
    ...(extraData && typeof extraData === 'object' ? (extraData as Record<string, unknown>) : {}),
  };

  const credential = await prisma.credential.create({
    data: {
      credentialNumber: generateCredentialNumber(),
      companyNumber: companyNumber.trim(),
      securityCode: await generateSecurityCode(),
      holderId: user!.holderProfile!.id,
      companyId,
      credentialTypeId: credentialType.id,
      issuedByUserId,
      issueDate: new Date(issueDate),
      expiryDate: computedExpiry,
      extraData: snapshot,
      photoUrl,
    },
  });

  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
  const holderName = `${holderFirstName.trim()} ${holderLastName.trim()}`;
  if (temporaryPassword) {
    const tpl = tplCredentialIssuedNew(holderName, credentialType.name, company?.name ?? '', email, temporaryPassword);
    await sendEmail(email, tpl.subject, tpl.html);
  } else {
    await prisma.notification.create({
      data: {
        userId: user!.id, channel: 'EMAIL', subject: 'Nowa legitymacja w Twoim portfelu',
        body: `Firma ${company?.name ?? ''} wystawiła Ci legitymację „${credentialType.name}”. Znajdziesz ją w portfelu po zalogowaniu na istniejące konto.`,
      },
    });
    const tpl = tplCredentialIssuedExisting(holderName, credentialType.name, company?.name ?? '');
    await sendEmail(email, tpl.subject, tpl.html);
  }

  await recordAuditLog({
    userId: issuedByUserId,
    companyId,
    action: 'CREDENTIAL_ISSUED',
    entityType: 'Credential',
    entityId: credential.id,
  });

  return {
    credential: { id: credential.id, credentialNumber: credential.credentialNumber, companyNumber: credential.companyNumber, securityCode: credential.securityCode },
    holderAccount: temporaryPassword
      ? { email, temporaryPassword, isNewAccount: true }
      : { email, isNewAccount: false },
  };
}

// Wystawienie nowej legitymacji - Company Admin / Company Staff
router.post(
  '/',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('credentials.issue'),
  asyncHandler(async (req: AuthRequest, res) => {
    const companyId = req.user!.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Brak przypisanej firmy do konta' });
    }

    try {
      const result = await issueCredential(companyId, req.user!.userId, req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Nie udało się wystawić legitymacji' });
    }
  })
);

// Masowe wystawianie legitymacji - Company Admin (API / import CSV/XLSX)
// Body: { rows: IssueInput[] } - maks. 500 wierszy na żądanie
router.post(
  '/bulk',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('credentials.import'),
  asyncHandler(async (req: AuthRequest, res) => {
    const companyId = req.user!.companyId;
    if (!companyId) {
      return res.status(400).json({ error: 'Brak przypisanej firmy do konta' });
    }

    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Brak wierszy do przetworzenia' });
    }
    if (rows.length > 500) {
      return res.status(400).json({ error: 'Maksymalnie 500 wierszy na jedno żądanie' });
    }

    const results = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const r = await issueCredential(companyId, req.user!.userId, rows[i]);
        results.push({
          row: i + 1,
          ok: true,
          credentialNumber: r.credential.companyNumber ?? r.credential.credentialNumber,
          securityCode: r.credential.securityCode,
          ...r.holderAccount,
        });
      } catch (err) {
        results.push({
          row: i + 1,
          ok: false,
          email: rows[i]?.holderEmail ?? null,
          error: err instanceof Error ? err.message : 'Błąd wystawiania',
        });
      }
    }

    const succeeded = results.filter((r) => r.ok).length;
    res.status(201).json({ total: rows.length, succeeded, failed: rows.length - succeeded, results });
  })
);

// Lista legitymacji wystawionych przez firmę (filtry: ?status=ACTIVE|EXPIRED|REVOKED|SUSPENDED, ?q=szukajka)
router.get(
  '/company',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { status, q } = req.query;
    const validStatuses = ['ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED'] as const;
    const search = typeof q === 'string' ? q.trim() : '';

    const credentials = await prisma.credential.findMany({
      where: {
        companyId: req.user!.companyId!,
        ...(typeof status === 'string' && (validStatuses as readonly string[]).includes(status)
          ? status === 'EXPIRED'
            ? { OR: [{ status: 'EXPIRED' as const }, { status: 'ACTIVE' as const, expiryDate: { lt: new Date() } }] }
            : status === 'ACTIVE'
              ? { status: 'ACTIVE' as const, OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] }
              : { status: status as (typeof validStatuses)[number] }
          : {}),
        ...(search
          ? {
              OR: [
                { credentialNumber: { contains: search, mode: 'insensitive' } },
                { companyNumber: { contains: search, mode: 'insensitive' } },
                { securityCode: { contains: search.replace(/[\s-]/g, ''), mode: 'insensitive' } },
                { credentialType: { name: { contains: search, mode: 'insensitive' } } },
                { holder: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
                { holder: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
                { holder: { user: { email: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: {
        credentialType: true,
        holder: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(credentials);
  })
);

// Historia weryfikacji legitymacji wystawionych przez firmę
router.get(
  '/company/verifications',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('verifications.view'),
  asyncHandler(async (req: AuthRequest, res) => {
    const logs = await prisma.verificationLog.findMany({
      where: { credential: { companyId: req.user!.companyId! } },
      include: {
        credential: {
          select: {
            credentialNumber: true,
            credentialType: { select: { name: true } },
            holder: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { verifiedAt: 'desc' },
      take: 200,
    });
    res.json(logs);
  })
);

// Legitymacje posiadacza (własny portfel)
router.get(
  '/my',
  authenticate,
  authorize('HOLDER'),
  asyncHandler(async (req: AuthRequest, res) => {
    const holderProfile = await prisma.holderProfile.findUnique({ where: { userId: req.user!.userId } });
    if (!holderProfile) {
      return res.json([]);
    }
    const credentials = await prisma.credential.findMany({
      where: { holderId: holderProfile.id },
      include: { credentialType: true, company: { select: { name: true, logoUrl: true, nip: true, regon: true, address: true, city: true, postalCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(credentials);
  })
);

// Szczegóły pojedynczej legitymacji - tylko właściciel
router.get(
  '/:id',
  authenticate,
  authorize('HOLDER'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const holderProfile = await prisma.holderProfile.findUnique({ where: { userId: req.user!.userId } });
    const credential = await prisma.credential.findFirst({
      where: { id, holderId: holderProfile?.id },
      include: {
        credentialType: true,
        company: { select: { name: true, logoUrl: true, nip: true, regon: true, address: true, city: true, postalCode: true } },
        holder: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      },
    });
    if (!credential) {
      return res.status(404).json({ error: 'Nie znaleziono legitymacji' });
    }
    res.json(credential);
  })
);

// Wygenerowanie dynamicznego tokenu QR dla danej legitymacji (tylko właściciel)
router.get(
  '/:id/qr-token',
  authenticate,
  authorize('HOLDER'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const holderProfile = await prisma.holderProfile.findUnique({ where: { userId: req.user!.userId } });
    const credential = await prisma.credential.findFirst({ where: { id, holderId: holderProfile?.id } });
    if (!credential) {
      return res.status(404).json({ error: 'Nie znaleziono legitymacji' });
    }
    const token = generateCredentialToken(credential.id);
    res.json({ token, expiresInSeconds: 45 });
  })
);

// Edycja legitymacji (numer firmowy, data ważności) - firma
router.patch(
  '/:id',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('credentials.manage'),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    try {
      await assertActiveSubscription(req.user!.companyId!);
    } catch (err) {
      return res.status(403).json({ error: err instanceof Error ? err.message : 'Brak aktywnej subskrypcji' });
    }
    const credential = await prisma.credential.findFirst({ where: { id, companyId: req.user!.companyId! } });
    if (!credential) return res.status(404).json({ error: 'Nie znaleziono legitymacji' });
    const { companyNumber, expiryDate, noExpiry } = req.body;
    if (companyNumber !== undefined && !String(companyNumber).trim()) {
      return res.status(400).json({ error: 'Numer legitymacji nie może być pusty' });
    }
    if (expiryDate && isNaN(new Date(expiryDate).getTime())) {
      return res.status(400).json({ error: 'Nieprawidłowa data ważności' });
    }
    const updated = await prisma.credential.update({
      where: { id },
      data: {
        ...(companyNumber !== undefined && { companyNumber: String(companyNumber).trim() }),
        ...(noExpiry === true ? { expiryDate: null } : expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
      },
    });
    await recordAuditLog({
      userId: req.user!.userId, companyId: req.user!.companyId, action: 'CREDENTIAL_UPDATED',
      entityType: 'Credential', entityId: id, metadata: { companyNumber, expiryDate, noExpiry },
    });
    res.json(updated);
  })
);

// Zawieszenie / przywrócenie legitymacji - firma
router.patch(
  '/:id/status',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('credentials.manage'),
  [body('status').isIn(['ACTIVE', 'SUSPENDED'])],
  asyncHandler(async (req: AuthRequest, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'Nieprawidłowy status' });
    const { id } = req.params;
    const credential = await prisma.credential.findFirst({ where: { id, companyId: req.user!.companyId! } });
    if (!credential) return res.status(404).json({ error: 'Nie znaleziono legitymacji' });
    if (credential.status === 'REVOKED') return res.status(400).json({ error: 'Unieważnionej legitymacji nie można przywrócić' });
    const updated = await prisma.credential.update({ where: { id }, data: { status: req.body.status } });
    await recordAuditLog({
      userId: req.user!.userId, companyId: req.user!.companyId,
      action: req.body.status === 'SUSPENDED' ? 'CREDENTIAL_SUSPENDED' : 'CREDENTIAL_REACTIVATED',
      entityType: 'Credential', entityId: id,
    });
    res.json(updated);
  })
);

// Unieważnienie legitymacji - firma
router.patch(
  '/:id/revoke',
  authenticate,
  authorize('COMPANY_ADMIN', 'COMPANY_STAFF'),
  requirePermission('credentials.manage'),
  [body('reason').notEmpty()],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const credential = await prisma.credential.findFirst({ where: { id, companyId: req.user!.companyId! } });
    if (!credential) {
      return res.status(404).json({ error: 'Nie znaleziono legitymacji' });
    }

    const updated = await prisma.credential.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason },
    });

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: req.user!.companyId,
      action: 'CREDENTIAL_REVOKED',
      entityType: 'Credential',
      entityId: id,
      metadata: { reason },
    });

    res.json(updated);
  })
);

export default router;
