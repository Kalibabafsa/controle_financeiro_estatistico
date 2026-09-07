import { Router } from 'express';
import { suspensoesController } from '../controllers/suspensoes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const suspensoesRouter = Router();

suspensoesRouter.use(authMiddleware, requireRole('DIRETOR'));
suspensoesRouter.get('/', asyncHandler(suspensoesController.list));
suspensoesRouter.post('/:id/liberar', asyncHandler(suspensoesController.liberar));
