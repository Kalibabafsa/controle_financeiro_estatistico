import { Router } from 'express';
import { configController } from '../controllers/config.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const configRouter = Router();

configRouter.use(authMiddleware, requireRole('DIRETOR'));
configRouter.get('/', asyncHandler(configController.get));
configRouter.patch('/valores-padrao', asyncHandler(configController.updateValoresPadrao));
configRouter.patch('/temporada', asyncHandler(configController.updateTemporada));
configRouter.patch('/pix', asyncHandler(configController.updatePix));
