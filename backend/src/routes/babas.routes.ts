import { Router } from 'express';
import { babasController } from '../controllers/babas.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const babasRouter = Router();

babasRouter.use(authMiddleware);

babasRouter.get('/', asyncHandler(babasController.list)); // diretor + sócio
babasRouter.post('/', requireRole('DIRETOR'), asyncHandler(babasController.create));
babasRouter.get('/:id', asyncHandler(babasController.getById)); // diretor + sócio
babasRouter.patch('/:id', requireRole('DIRETOR'), asyncHandler(babasController.update));
babasRouter.put('/:id/presenca', requireRole('DIRETOR'), asyncHandler(babasController.setPresenca));
babasRouter.post('/:id/sorteio', requireRole('DIRETOR'), asyncHandler(babasController.sortear));
babasRouter.put('/:id/times', requireRole('DIRETOR'), asyncHandler(babasController.setTimes));
babasRouter.get('/:id/eventos', asyncHandler(babasController.listEventos)); // diretor + sócio
babasRouter.post('/:id/eventos', requireRole('DIRETOR'), asyncHandler(babasController.createEvento));
