import type { Request, Response } from 'express';
import { rankingsService } from '../services/rankings.service';
import { rankingsQuerySchema } from '../schemas/babas.schemas';

export const rankingsController = {
  async get(req: Request, res: Response): Promise<void> {
    const query = rankingsQuerySchema.parse(req.query);
    res.status(200).json(await rankingsService.get(query));
  },
};
