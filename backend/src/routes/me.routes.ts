import { Router } from 'express';
import { meController } from '../controllers/me.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';

// Todas as rotas de autoatendimento do sócio (ADR-08) — resolvem o dono do
// recurso a partir do JWT, nunca recebem :id de sócio na URL.
export const meRouter = Router();

meRouter.use(authMiddleware);

meRouter.get('/', asyncHandler(meController.getMe));
meRouter.get('/perfil', asyncHandler(meController.getPerfil));
meRouter.patch('/perfil', asyncHandler(meController.updatePerfil));
meRouter.get('/mensalidades', asyncHandler(meController.getMensalidades));
meRouter.get('/situacao', asyncHandler(meController.getSituacao));
meRouter.get('/proximo-baba', asyncHandler(meController.getProximoBaba));
