import type { Request, Response } from 'express';
import { inadimplenciaService } from '../services/inadimplencia.service';
import { monthQuerySchema } from '../schemas/financeiro.schemas';

export const inadimplenciaController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = monthQuerySchema.parse(req.query);
    res.status(200).json(await inadimplenciaService.getInadimplentes(query.month ?? new Date()));
  },
};
