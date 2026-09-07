import { Router } from 'express';
import { convidadosController } from '../controllers/convidados.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const convidadosRouter = Router();

convidadosRouter.use(authMiddleware, requireRole('DIRETOR'));

convidadosRouter.get('/', asyncHandler(convidadosController.list));
convidadosRouter.post('/', asyncHandler(convidadosController.create));
convidadosRouter.get('/:id', asyncHandler(convidadosController.getById));
convidadosRouter.patch('/:id', asyncHandler(convidadosController.update));
convidadosRouter.post('/:id/remover-contato', asyncHandler(convidadosController.removeContact));
