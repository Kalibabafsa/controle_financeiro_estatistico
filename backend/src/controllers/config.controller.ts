import type { Request, Response } from 'express';
import { configService } from '../services/config.service';
import { updatePixConfigSchema, updateTemporadaSchema, updateValoresPadraoSchema } from '../schemas/config.schemas';

export const configController = {
  async get(_req: Request, res: Response): Promise<void> {
    const config = await configService.get();
    // Nunca serializa credenciais (não existem no schema, mas reforça o contrato).
    res.status(200).json(config);
  },

  async updateValoresPadrao(req: Request, res: Response): Promise<void> {
    const input = updateValoresPadraoSchema.parse(req.body);
    res.status(200).json(await configService.updateValoresPadrao(input, req.user!.sub));
  },

  async updateTemporada(req: Request, res: Response): Promise<void> {
    const input = updateTemporadaSchema.parse(req.body);
    res.status(200).json(await configService.updateTemporada(input, req.user!.sub));
  },

  async updatePix(req: Request, res: Response): Promise<void> {
    const input = updatePixConfigSchema.parse(req.body);
    res.status(200).json(await configService.updatePix(input, req.user!.sub));
  },
};
