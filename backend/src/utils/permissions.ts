import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const PERMISSIONS = [
  'credentials.issue',
  'credentials.import',
  'credentials.manage',
  'verifications.view',
  'billing.view',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export function sanitizePermissions(input: unknown): Permission[] {
  return Array.isArray(input) ? PERMISSIONS.filter((p) => input.includes(p)) : [];
}

export function requirePermission(permission: Permission) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'COMPANY_ADMIN' || req.user?.role === 'SUPER_ADMIN') return next();
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { permissions: true, isActive: true } });
    if (!user?.isActive || !user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Brak uprawnień do tej operacji — skontaktuj się z administratorem firmy' });
    }
    next();
  };
}
