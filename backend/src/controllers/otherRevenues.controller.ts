import type { Request, Response } from 'express';
import { otherRevenuesService } from '../services/otherRevenues.service';
import { createOtherRevenueSchema, monthQuerySchema } from '../schemas/financeiro.schemas';

export const otherRevenuesController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = monthQuerySchema.parse(req.query);
    res.status(200).json(await otherRevenuesService.listByMonth(query.month ?? new Date()));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createOtherRevenueSchema.parse(req.body);
    res.status(201).json(await otherRevenuesService.create(input, req.user!.sub));
  },
};
