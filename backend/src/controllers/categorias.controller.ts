import type { Request, Response } from 'express';
import { expenseCategoriesService, revenueCategoriesService } from '../services/categorias.service';
import { createCategorySchema, updateCategorySchema } from '../schemas/financeiro.schemas';

export const categoriasController = {
  async listExpense(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await expenseCategoriesService.list());
  },
  async createExpense(req: Request, res: Response): Promise<void> {
    const input = createCategorySchema.parse(req.body);
    res.status(201).json(await expenseCategoriesService.create(input));
  },
  async updateExpense(req: Request, res: Response): Promise<void> {
    const input = updateCategorySchema.parse(req.body);
    res.status(200).json(await expenseCategoriesService.update(req.params.id, input));
  },

  async listRevenue(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await revenueCategoriesService.list());
  },
  async createRevenue(req: Request, res: Response): Promise<void> {
    const input = createCategorySchema.parse(req.body);
    res.status(201).json(await revenueCategoriesService.create(input));
  },
  async updateRevenue(req: Request, res: Response): Promise<void> {
    const input = updateCategorySchema.parse(req.body);
    res.status(200).json(await revenueCategoriesService.update(req.params.id, input));
  },
};
