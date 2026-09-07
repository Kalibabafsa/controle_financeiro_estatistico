import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { toReferenceMonth } from '../lib/date';

// A despesa é lançada por semana (weekStart/weekEnd), mas para efeito de saldo mensal
// (ADR-03) e dashboard, o mês de referência é o mês de weekStart.
function monthRangeFromWeekStart(referenceMonth: Date) {
  const start = toReferenceMonth(referenceMonth);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { gte: start, lt: end };
}

export const expensesRepository = {
  findByMonth(referenceMonth: Date) {
    return prisma.expense.findMany({
      where: { weekStart: monthRangeFromWeekStart(referenceMonth) },
      include: { category: true },
      orderBy: { weekStart: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.expense.findUnique({ where: { id }, include: { category: true } });
  },

  create(data: Prisma.ExpenseCreateInput) {
    return prisma.expense.create({ data });
  },

  async sumByMonth(referenceMonth: Date): Promise<Prisma.Decimal> {
    const result = await prisma.expense.aggregate({
      where: { weekStart: monthRangeFromWeekStart(referenceMonth) },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  },
};
