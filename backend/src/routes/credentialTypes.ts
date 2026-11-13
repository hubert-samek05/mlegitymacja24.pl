import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../middleware/auditLog';

const router = Router();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Publiczna lista aktywnych typów legitymacji (wyszukiwanie: ?q=, filtr: ?category=)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, category } = req.query;
    const types = await prisma.credentialType.findMany({
      where: {
        isActive: true,
        ...(typeof q === 'string' && q.trim()
          ? { name: { contains: q.trim(), mode: 'insensitive' } }
          : {}),
        ...(typeof category === 'string' && category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json(types);
  })
);

// Lista kategorii z liczbą typów (do grupowego wyboru)
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const grouped = await prisma.credentialType.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { category: 'asc' },
    });
    res.json(grouped.map((g) => ({ category: g.category ?? 'Inne', count: g._count._all })));
  })
);

// Zgłoszenie własnego typu legitymacji przez firmę - trafia do weryfikacji Super Admina
router.post(
  '/requests',
  authenticate,
  authorize('COMPANY_ADMIN'),
  [
    body('name').notEmpty().isLength({ max: 120 }),
    body('defaultValidityMonths').optional({ values: 'null' }).isInt({ min: 1, max: 600 }),
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, defaultValidityMonths } = req.body;
    const trimmed = name.trim();

    const existingType = await prisma.credentialType.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existingType) {
      return res.status(409).json({ error: 'Taki typ legitymacji już istnieje w katalogu' });
    }

    const existingRequest = await prisma.credentialTypeRequest.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' }, status: 'PENDING' },
    });
    if (existingRequest) {
      return res.status(409).json({ error: 'Taki typ został już zgłoszony i oczekuje na weryfikację' });
    }

    const request = await prisma.credentialTypeRequest.create({
      data: {
        name: trimmed,
        description,
        category,
        defaultValidityMonths: defaultValidityMonths === undefined ? 24 : defaultValidityMonths,
        companyId: req.user!.companyId!,
        createdByUserId: req.user!.userId,
      },
      include: { company: { select: { name: true } } },
    });

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: req.user!.companyId,
      action: 'CREDENTIAL_TYPE_REQUESTED',
      entityType: 'CredentialTypeRequest',
      entityId: request.id,
      metadata: { name: trimmed },
    });

    res.status(201).json(request);
  })
);

// Zgłoszenia typów: Super Admin widzi wszystkie, firma tylko własne
router.get(
  '/requests',
  authenticate,
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_STAFF'),
  asyncHandler(async (req: AuthRequest, res) => {
    const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
    const { status } = req.query;
    const requests = await prisma.credentialTypeRequest.findMany({
      where: {
        ...(isSuperAdmin ? {} : { companyId: req.user!.companyId! }),
        ...(typeof status === 'string' && status ? { status: status as never } : {}),
      },
      include: {
        company: { select: { name: true, nip: true } },
        createdByUser: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  })
);

// Akceptacja / odrzucenie zgłoszenia - Super Admin
router.patch(
  '/requests/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  [body('status').isIn(['APPROVED', 'REJECTED'])],
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { status, reviewNote, category, name } = req.body;

    const request = await prisma.credentialTypeRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Nie znaleziono zgłoszenia' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Zgłoszenie zostało już rozpatrzone' });
    }

    let credentialTypeId: string | null = null;
    if (status === 'APPROVED') {
      const finalName = (name ?? request.name).trim();
      const type = await prisma.credentialType.create({
        data: {
          name: finalName,
          slug: `${slugify(finalName)}-${request.id.slice(0, 6)}`,
          description: request.description,
          category: category ?? request.category,
          defaultValidityMonths: request.defaultValidityMonths,
        },
      });
      credentialTypeId = type.id;
    }

    const updated = await prisma.credentialTypeRequest.update({
      where: { id },
      data: {
        status,
        reviewNote,
        credentialTypeId,
        reviewedAt: new Date(),
        reviewedByUserId: req.user!.userId,
      },
    });

    await recordAuditLog({
      userId: req.user!.userId,
      companyId: request.companyId,
      action: `CREDENTIAL_TYPE_REQUEST_${status}`,
      entityType: 'CredentialTypeRequest',
      entityId: id,
    });

    res.json(updated);
  })
);

router.post(
  '/',
  authenticate,
  authorize('SUPER_ADMIN'),
  [body('name').notEmpty(), body('slug').notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, slug, description, category, defaultValidityMonths, fieldsSchema } = req.body;

    const type = await prisma.credentialType.create({
      data: { name, slug, description, category, defaultValidityMonths, fieldsSchema },
    });
    res.status(201).json(type);
  })
);

router.patch(
  '/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, category, defaultValidityMonths, isActive, fieldsSchema } = req.body;
    const type = await prisma.credentialType.update({
      where: { id },
      data: { name, description, category, defaultValidityMonths, isActive, fieldsSchema },
    });
    res.json(type);
  })
);

export default router;
