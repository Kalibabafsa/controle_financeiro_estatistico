import type { Request, Response } from 'express';
import { mensalidadesService } from '../services/mensalidades.service';
import { createMensalidadeSchema, listMensalidadesQuerySchema, meMensalidadesQuerySchema } from '../schemas/financeiro.schemas';

export const mensalidadesController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listMensalidadesQuerySchema.parse(req.query);
    res.status(200).json(await mensalidadesService.list(query));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createMensalidadeSchema.parse(req.body);
    res.status(201).json(await mensalidadesService.create(input, req.user!.sub));
  },

  async meHistory(req: Request, res: Response): Promise<void> {
    const query = meMensalidadesQuerySchema.parse(req.query);
    const socioId = req.user!.socioId!;
    res.status(200).json(await mensalidadesService.meHistory(socioId, query.year));
  },
};
