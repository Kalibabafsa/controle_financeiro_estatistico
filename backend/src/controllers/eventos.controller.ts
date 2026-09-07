import type { Request, Response } from 'express';
import { gameEventsService } from '../services/gameEvents.service';

export const eventosController = {
  async delete(req: Request, res: Response): Promise<void> {
    await gameEventsService.delete(req.params.id, req.user!.sub);
    res.status(204).send();
  },
};
