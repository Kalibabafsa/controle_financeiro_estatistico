import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const socioPaymentsRepository = {
  findMany(where: Prisma.SocioPaymentWhereInput) {
    return prisma.socioPayment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: { socio: { select: { id: true, name: true } } },
    });
  },

  findByMonth(referenceMonth: Date) {
    return prisma.socioPayment.findMany({ where: { referenceMonth } });
  },

  findBySocioAndMonth(socioId: string, referenceMonth: Date) {
    return prisma.socioPayment.findUnique({
      where: { socioId_referenceMonth: { socioId, referenceMonth } },
    });
  },

  findBySocio(socioId: string, year?: number) {
    return prisma.socioPayment.findMany({
      where: {
        socioId,
        ...(year
          ? {
              referenceMonth: {
                gte: new Date(Date.UTC(year, 0, 1)),
                lt: new Date(Date.UTC(year + 1, 0, 1)),
              },
            }
          : {}),
      },
      orderBy: { referenceMonth: 'desc' },
    });
  },

  create(data: Prisma.SocioPaymentCreateInput) {
    return prisma.socioPayment.create({ data });
  },

  async sumByMonth(referenceMonth: Date): Promise<Prisma.Decimal> {
    const result = await prisma.socioPayment.aggregate({
      where: { referenceMonth },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  },

  countDistinctSociosByMonth(referenceMonth: Date) {
    return prisma.socioPayment.findMany({ where: { referenceMonth }, select: { socioId: true } });
  },
};
