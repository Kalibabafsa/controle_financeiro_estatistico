import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);
dashboardRouter.get('/financeiro', requireRole('DIRETOR'), asyncHandler(dashboardController.financeiro));

export const situacaoGeralRouter = Router();
situacaoGeralRouter.use(authMiddleware);
situacaoGeralRouter.get('/', asyncHandler(dashboardController.situacaoGeral));
