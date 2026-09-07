import type { Request, Response } from 'express';
import { pixService } from '../services/pix.service';
import { pixPayloadQuerySchema } from '../schemas/config.schemas';

export const pixController = {
  async getPayload(req: Request, res: Response): Promise<void> {
    const query = pixPayloadQuerySchema.parse(req.query);
    res.status(200).json(await pixService.getPayload(query.amount, query.referenceMonth));
  },
};
