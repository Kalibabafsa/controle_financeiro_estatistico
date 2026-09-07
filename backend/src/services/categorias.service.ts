import { expenseCategoriesRepository } from '../repositories/expenseCategories.repository';
import { revenueCategoriesRepository } from '../repositories/revenueCategories.repository';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/domain-errors';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/financeiro.schemas';

export const expenseCategoriesService = {
  list() {
    return expenseCategoriesRepository.findMany();
  },

  async create(input: CreateCategoryInput) {
    const existing = await expenseCategoriesRepository.findByName(input.name);
    if (existing) throw new ConflictError('Já existe uma categoria de despesa com este nome.');
    return expenseCategoriesRepository.create({ name: input.name });
  },

  async update(id: string, input: UpdateCategoryInput) {
    const category = await expenseCategoriesRepository.findById(id);
    if (!category) throw new NotFoundError('Categoria de despesa', id);
    return expenseCategoriesRepository.update(id, input);
  },
};

export const revenueCategoriesService = {
  list() {
    return revenueCategoriesRepository.findMany();
  },

  async create(input: CreateCategoryInput) {
    const existing = await revenueCategoriesRepository.findByName(input.name);
    if (existing) throw new ConflictError('Já existe uma categoria de receita com este nome.');
    return revenueCategoriesRepository.create({ name: input.name, isSystem: false });
  },

  async update(id: string, input: UpdateCategoryInput) {
    const category = await revenueCategoriesRepository.findById(id);
    if (!category) throw new NotFoundError('Categoria de receita', id);
    if (category.isSystem) {
      throw new ForbiddenError('Categorias de receita do sistema (Mensalidades/Convidados) não podem ser alteradas.');
    }
    return revenueCategoriesRepository.update(id, input);
  },
};
