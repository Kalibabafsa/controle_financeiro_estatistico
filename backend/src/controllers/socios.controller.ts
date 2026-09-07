import type { Request, Response } from 'express';
import { sociosService } from '../services/socios.service';
import {
  createSocioSchema,
  listSociosQuerySchema,
  updateSocioSchema,
  updateSocioStatusSchema,
} from '../schemas/socios.schemas';

export const sociosController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listSociosQuerySchema.parse(req.query);
    const result = await sociosService.list(query);
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    // Observação DM só é serializada para o diretor (RSP2) — nunca via select *.
    const isDirector = req.user?.role === 'DIRETOR';
    const socio = await sociosService.getById(req.params.id, isDirector);
    res.status(200).json(socio);
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createSocioSchema.parse(req.body);
    const socio = await sociosService.create(input);
    res.status(201).json(socio);
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = updateSocioSchema.parse(req.body);
    const socio = await sociosService.update(req.params.id, input);
    res.status(200).json(socio);
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const input = updateSocioStatusSchema.parse(req.body);
    const record = await sociosService.updateStatus(req.params.id, input, req.user!.sub);
    res.status(200).json(record);
  },

  async getStatusHistory(req: Request, res: Response): Promise<void> {
    const isDirector = req.user?.role === 'DIRETOR';
    const history = await sociosService.getStatusHistory(req.params.id, isDirector);
    res.status(200).json(history);
  },
};
