import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const prestacoesRepository = {
  findAll() {
    return prisma.accountabilityReport.findMany({ orderBy: { referenceMonth: 'desc' } });
  },

  findByMonth(referenceMonth: Date) {
    return prisma.accountabilityReport.findUnique({ where: { referenceMonth } });
  },

  create(data: Prisma.AccountabilityReportCreateInput) {
    return prisma.accountabilityReport.create({ data });
  },
};
