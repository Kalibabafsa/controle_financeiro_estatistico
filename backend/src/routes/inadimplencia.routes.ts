import { Router } from 'express';
import { inadimplenciaController } from '../controllers/inadimplencia.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const inadimplenciaRouter = Router();

inadimplenciaRouter.use(authMiddleware, requireRole('DIRETOR'));
inadimplenciaRouter.get('/', asyncHandler(inadimplenciaController.list));
