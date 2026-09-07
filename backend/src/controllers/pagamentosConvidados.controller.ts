import type { Request, Response } from 'express';
import { pagamentosConvidadosService } from '../services/pagamentosConvidados.service';
import { createPagamentoConvidadoSchema, listPagamentosConvidadosQuerySchema } from '../schemas/financeiro.schemas';

export const pagamentosConvidadosController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listPagamentosConvidadosQuerySchema.parse(req.query);
    res.status(200).json(await pagamentosConvidadosService.list(query));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createPagamentoConvidadoSchema.parse(req.body);
    res.status(201).json(await pagamentosConvidadosService.create(input, req.user!.sub));
  },
};
