import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyCredentialToken } from '../utils/credentialToken';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Osobny limit dla publicznej weryfikacji - obrona przed odpytywaniem kodów
const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(['/token', '/code'], verifyLimiter);

const credentialSelect = {
  credentialType: true,
  company: {
    select: { name: true, logoUrl: true, nip: true, regon: true, address: true, city: true, postalCode: true },
  },
  holder: { include: { user: { select: { firstName: true, lastName: true } } } },
} as const;

async function respondWithCredential(
  res: Response,
  credential: NonNullable<Awaited<ReturnType<typeof findCredential>>>,
  ipAddress?: string,
  userAgent?: string,
) {
  let result: 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED' = 'VALID';
  if (credential.status === 'REVOKED') result = 'REVOKED';
  else if (credential.status === 'SUSPENDED') result = 'SUSPENDED';
  else if (credential.expiryDate && credential.expiryDate < new Date()) result = 'EXPIRED';

  await prisma.verificationLog.create({
    data: { credentialId: credential.id, result, ipAddress, userAgent },
  });

  const snapshot = (credential.extraData ?? {}) as Record<string, unknown>;
  const snapshotKeys = new Set(['holderFirstName', 'holderLastName', 'holderDateOfBirth', 'holderPlaceOfBirth']);
  const additionalData = Object.fromEntries(
    Object.entries(snapshot).filter(([k, v]) => !snapshotKeys.has(k) && v != null && String(v).trim() !== '')
  );

  res.json({
    result,
    verifiedAt: new Date().toISOString(),
    credential: {
      holderName: `${credential.holder.user.firstName} ${credential.holder.user.lastName}`,
      dateOfBirth: (snapshot.holderDateOfBirth as string) ?? credential.holder.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      placeOfBirth: (snapshot.holderPlaceOfBirth as string) ?? credential.holder.placeOfBirth ?? null,
      credentialType: credential.credentialType.name,
      credentialCategory: credential.credentialType.category ?? null,
      credentialNumber: credential.credentialNumber,
      companyNumber: credential.companyNumber,
      securityCode: credential.securityCode,
      companyName: credential.company.name,
      companyLogoUrl: credential.company.logoUrl,
      companyNip: credential.company.nip,
      companyRegon: credential.company.regon,
      companyAddress: credential.company.address,
      companyCity: credential.company.city,
      companyPostalCode: credential.company.postalCode,
      issueDate: credential.issueDate,
      expiryDate: credential.expiryDate,
      photoUrl: credential.photoUrl,
      additionalData,
    },
  });
}

function findCredential(id: string) {
  return prisma.credential.findUnique({ where: { id }, include: credentialSelect });
}

// Publiczna weryfikacja legitymacji na podstawie dynamicznego tokenu z kodu QR.
// Zwraca wyłącznie minimalny, niewrażliwy zestaw danych.
router.post(
  '/token',
  [body('token').notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const check = verifyCredentialToken(token);

    if (!check.valid || !check.credentialId) {
      await prisma.verificationLog.create({
        data: { result: 'NOT_FOUND', ipAddress, userAgent },
      });
      return res.status(200).json({ result: check.reason === 'EXPIRED' ? 'EXPIRED' : 'NOT_FOUND' });
    }

    const credential = await findCredential(check.credentialId);
    if (!credential) {
      await prisma.verificationLog.create({
        data: { result: 'NOT_FOUND', ipAddress, userAgent },
      });
      return res.json({ result: 'NOT_FOUND' });
    }

    return respondWithCredential(res, credential, ipAddress, userAgent);
  })
);

// Weryfikacja po identyfikatorze mLegitymacji (16-znakowy kod z legitymacji) - bez QR
router.post(
  '/code',
  [body('code').isString().isLength({ min: 8, max: 40 })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const normalized = String(req.body.code).toUpperCase().replace(/[^A-Z0-9]/g, '');

    const credential = await prisma.credential.findUnique({
      where: { securityCode: normalized },
      include: credentialSelect,
    });

    if (!credential) {
      await prisma.verificationLog.create({
        data: { result: 'NOT_FOUND', ipAddress, userAgent },
      });
      return res.json({ result: 'NOT_FOUND' });
    }

    return respondWithCredential(res, credential, ipAddress, userAgent);
  })
);

// Historia weryfikacji danej legitymacji - posiadacz, firma wystawiająca lub Super Admin
router.get(
  '/history/:credentialId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { credentialId } = req.params;

    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      select: { companyId: true, holderId: true },
    });
    if (!credential) {
      return res.status(404).json({ error: 'Nie znaleziono legitymacji' });
    }

    if (req.user!.role !== 'SUPER_ADMIN') {
      if (req.user!.companyId === credential.companyId) {
        // firma wystawiająca - dostęp OK
      } else {
        const holderProfile = await prisma.holderProfile.findUnique({
          where: { userId: req.user!.userId },
          select: { id: true },
        });
        if (!holderProfile || holderProfile.id !== credential.holderId) {
          return res.status(403).json({ error: 'Brak uprawnień do historii tej legitymacji' });
        }
      }
    }

    const logs = await prisma.verificationLog.findMany({
      where: { credentialId },
      orderBy: { verifiedAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  })
);

// Historia weryfikacji wszystkich legitymacji posiadacza
router.get(
  '/my-history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const holderProfile = await prisma.holderProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!holderProfile) {
      return res.json([]);
    }
    const logs = await prisma.verificationLog.findMany({
      where: { credential: { holderId: holderProfile.id } },
      include: {
        credential: {
          select: {
            credentialNumber: true,
            companyNumber: true,
            securityCode: true,
            credentialType: { select: { name: true } },
          },
        },
      },
      orderBy: { verifiedAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  })
);

export default router;
