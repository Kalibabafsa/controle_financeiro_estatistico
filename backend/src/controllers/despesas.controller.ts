import type { Request, Response } from 'express';
import { despesasService } from '../services/despesas.service';
import { createDespesaSchema, monthQuerySchema } from '../schemas/financeiro.schemas';

export const despesasController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = monthQuerySchema.parse(req.query);
    res.status(200).json(await despesasService.listByMonth(query.month ?? new Date()));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createDespesaSchema.parse(req.body);
    const file = req.file;
    const attachment = file
      ? { buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname }
      : undefined;
    res.status(201).json(await despesasService.create(input, req.user!.sub, attachment));
  },

  async getAnexo(req: Request, res: Response): Promise<void> {
    const url = await despesasService.getAttachmentSignedUrl(req.params.id);
    res.status(200).json({ url });
  },
};
