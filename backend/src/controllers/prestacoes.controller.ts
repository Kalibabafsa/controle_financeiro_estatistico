import type { Request, Response } from 'express';
import { prestacoesService } from '../services/prestacoes.service';
import { generatePrestacaoSchema, monthParamSchema, parseMonthParam } from '../schemas/prestacoes.schemas';

export const prestacoesController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await prestacoesService.list());
  },

  async preview(req: Request, res: Response): Promise<void> {
    const { month } = monthParamSchema.parse(req.params);
    res.status(200).json(await prestacoesService.preview(parseMonthParam(month)));
  },

  async generate(req: Request, res: Response): Promise<void> {
    const input = generatePrestacaoSchema.parse(req.body);
    res.status(201).json(await prestacoesService.generate(input.referenceMonth, req.user!.sub));
  },

  async getPdf(req: Request, res: Response): Promise<void> {
    const { month } = monthParamSchema.parse(req.params);
    const url = await prestacoesService.getPdfUrl(parseMonthParam(month));
    res.status(200).json({ url });
  },
};
