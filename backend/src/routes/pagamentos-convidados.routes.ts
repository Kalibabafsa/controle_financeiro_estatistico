import { Router } from 'express';
import { pagamentosConvidadosController } from '../controllers/pagamentosConvidados.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const pagamentosConvidadosRouter = Router();

pagamentosConvidadosRouter.use(authMiddleware, requireRole('DIRETOR'));
pagamentosConvidadosRouter.get('/', asyncHandler(pagamentosConvidadosController.list));
pagamentosConvidadosRouter.post('/', asyncHandler(pagamentosConvidadosController.create));
