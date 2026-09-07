import { Router } from 'express';
import { eventosController } from '../controllers/eventos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const eventosRouter = Router();

eventosRouter.use(authMiddleware, requireRole('DIRETOR'));
eventosRouter.delete('/:id', asyncHandler(eventosController.delete));
