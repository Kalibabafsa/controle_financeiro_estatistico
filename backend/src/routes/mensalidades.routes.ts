import { Router } from 'express';
import { mensalidadesController } from '../controllers/mensalidades.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const mensalidadesRouter = Router();

mensalidadesRouter.use(authMiddleware, requireRole('DIRETOR'));
mensalidadesRouter.get('/', asyncHandler(mensalidadesController.list));
mensalidadesRouter.post('/', asyncHandler(mensalidadesController.create));
