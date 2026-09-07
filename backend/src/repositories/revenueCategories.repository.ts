import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const revenueCategoriesRepository = {
  findMany() {
    return prisma.revenueCategory.findMany({ orderBy: { name: 'asc' } });
  },
  findById(id: string) {
    return prisma.revenueCategory.findUnique({ where: { id } });
  },
  findByName(name: string) {
    return prisma.revenueCategory.findUnique({ where: { name } });
  },
  create(data: Prisma.RevenueCategoryCreateInput) {
    return prisma.revenueCategory.create({ data });
  },
  update(id: string, data: Prisma.RevenueCategoryUpdateInput) {
    return prisma.revenueCategory.update({ where: { id }, data });
  },
};

export const otherRevenuesRepository = {
  findByMonth(referenceMonth: Date) {
    return prisma.otherRevenue.findMany({
      where: { referenceMonth },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  },
  create(data: Prisma.OtherRevenueCreateInput) {
    return prisma.otherRevenue.create({ data });
  },
  async sumByMonth(referenceMonth: Date): Promise<Prisma.Decimal> {
    const result = await prisma.otherRevenue.aggregate({
      where: { referenceMonth },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  },
};
