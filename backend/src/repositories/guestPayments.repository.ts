import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { toReferenceMonth } from '../lib/date';

function monthRange(referenceMonth: Date) {
  const start = toReferenceMonth(referenceMonth);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { gte: start, lt: end };
}

export const guestPaymentsRepository = {
  findMany(where: Prisma.GuestPaymentWhereInput) {
    return prisma.guestPayment.findMany({
      where,
      orderBy: { matchDate: 'desc' },
      include: { convidado: { select: { id: true, name: true } } },
    });
  },

  create(data: Prisma.GuestPaymentCreateInput) {
    return prisma.guestPayment.create({ data });
  },

  async sumByMonth(referenceMonth: Date): Promise<Prisma.Decimal> {
    const result = await prisma.guestPayment.aggregate({
      where: { matchDate: monthRange(referenceMonth) },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  },
};
