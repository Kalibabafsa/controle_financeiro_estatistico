import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const monthlyClosingBalanceRepository = {
  findByMonth(referenceMonth: Date) {
    return prisma.monthlyClosingBalance.findUnique({ where: { referenceMonth } });
  },

  findLatestBefore(referenceMonth: Date) {
    return prisma.monthlyClosingBalance.findFirst({
      where: { referenceMonth: { lt: referenceMonth } },
      orderBy: { referenceMonth: 'desc' },
    });
  },

  findNextAfter(referenceMonth: Date) {
    return prisma.monthlyClosingBalance.findFirst({
      where: { referenceMonth: { gt: referenceMonth } },
      orderBy: { referenceMonth: 'asc' },
    });
  },

  findLastN(n: number) {
    return prisma.monthlyClosingBalance.findMany({
      orderBy: { referenceMonth: 'desc' },
      take: n,
    });
  },

  upsert(referenceMonth: Date, data: Omit<Prisma.MonthlyClosingBalanceCreateInput, 'referenceMonth'>) {
    return prisma.monthlyClosingBalance.upsert({
      where: { referenceMonth },
      create: { referenceMonth, ...data },
      update: data,
    });
  },
};
