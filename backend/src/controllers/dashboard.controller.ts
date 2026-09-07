import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { monthQuerySchema } from '../schemas/financeiro.schemas';

export const dashboardController = {
  async financeiro(req: Request, res: Response): Promise<void> {
    const query = monthQuerySchema.parse(req.query);
    res.status(200).json(await dashboardService.getFinanceiro(query.month ?? new Date()));
  },

  async situacaoGeral(req: Request, res: Response): Promise<void> {
    const query = monthQuerySchema.parse(req.query);
    res.status(200).json(await dashboardService.getSituacaoGeral(query.month ?? new Date()));
  },
};
