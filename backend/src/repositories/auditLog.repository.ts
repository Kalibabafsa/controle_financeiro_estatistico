import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const auditLogRepository = {
  create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  },
};
