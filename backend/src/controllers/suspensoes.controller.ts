import type { Request, Response } from 'express';
import { suspensionService } from '../services/suspension.service';
import { liberarSuspensaoSchema } from '../schemas/babas.schemas';

export const suspensoesController = {
  async list(_req: Request, res: Response): Promise<void> {
    const [ativas, historico] = await Promise.all([suspensionService.listActive(), suspensionService.listAll()]);
    res.status(200).json({ ativas, historico });
  },

  async liberar(req: Request, res: Response): Promise<void> {
    const input = liberarSuspensaoSchema.parse(req.body);
    res.status(200).json(await suspensionService.liberar(req.params.id, input, req.user!.sub));
  },
};
