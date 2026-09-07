import { Router } from 'express';
import { sociosController } from '../controllers/socios.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { requireOwnerOrDirector } from '../middlewares/ownership.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const sociosRouter = Router();

sociosRouter.use(authMiddleware);

sociosRouter.get('/', requireRole('DIRETOR'), asyncHandler(sociosController.list));
sociosRouter.post('/', requireRole('DIRETOR'), asyncHandler(sociosController.create));
sociosRouter.get('/:id', requireOwnerOrDirector(), asyncHandler(sociosController.getById));
sociosRouter.patch('/:id', requireRole('DIRETOR'), asyncHandler(sociosController.update));
sociosRouter.patch('/:id/status', requireRole('DIRETOR'), asyncHandler(sociosController.updateStatus));
sociosRouter.get('/:id/status-history', requireOwnerOrDirector(), asyncHandler(sociosController.getStatusHistory));
