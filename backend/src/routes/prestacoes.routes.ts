import { Router } from 'express';
import { prestacoesController } from '../controllers/prestacoes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const prestacoesRouter = Router();

prestacoesRouter.use(authMiddleware);

prestacoesRouter.get('/', asyncHandler(prestacoesController.list)); // diretor + sócio
prestacoesRouter.get('/:month/preview', requireRole('DIRETOR'), asyncHandler(prestacoesController.preview));
prestacoesRouter.post('/', requireRole('DIRETOR'), asyncHandler(prestacoesController.generate));
prestacoesRouter.get('/:month/pdf', asyncHandler(prestacoesController.getPdf)); // diretor + sócio
