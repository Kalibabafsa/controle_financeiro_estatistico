import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const expenseCategoriesRepository = {
  findMany() {
    return prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
  },
  findById(id: string) {
    return prisma.expenseCategory.findUnique({ where: { id } });
  },
  findByName(name: string) {
    return prisma.expenseCategory.findUnique({ where: { name } });
  },
  create(data: Prisma.ExpenseCategoryCreateInput) {
    return prisma.expenseCategory.create({ data });
  },
  update(id: string, data: Prisma.ExpenseCategoryUpdateInput) {
    return prisma.expenseCategory.update({ where: { id }, data });
  },
};
