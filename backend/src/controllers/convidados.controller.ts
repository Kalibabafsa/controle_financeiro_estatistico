import type { Request, Response } from 'express';
import { convidadosService } from '../services/convidados.service';
import { createConvidadoSchema, listConvidadosQuerySchema, updateConvidadoSchema } from '../schemas/convidados.schemas';

export const convidadosController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listConvidadosQuerySchema.parse(req.query);
    res.status(200).json(await convidadosService.list(query));
  },

  async getById(req: Request, res: Response): Promise<void> {
    res.status(200).json(await convidadosService.getById(req.params.id));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createConvidadoSchema.parse(req.body);
    res.status(201).json(await convidadosService.create(input));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = updateConvidadoSchema.parse(req.body);
    res.status(200).json(await convidadosService.update(req.params.id, input));
  },

  async removeContact(req: Request, res: Response): Promise<void> {
    await convidadosService.removeContact(req.params.id, req.user!.sub);
    res.status(204).send();
  },
};
