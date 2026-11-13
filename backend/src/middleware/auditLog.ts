import { prisma } from '../config/prisma';

interface AuditLogParams {
  userId?: string | null;
  companyId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function recordAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        companyId: params.companyId ?? undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata as any,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Nie udało się zapisać logu audytowego:', err);
  }
}
