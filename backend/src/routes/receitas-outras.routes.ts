import { Router } from 'express';
import { otherRevenuesController } from '../controllers/otherRevenues.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const receitasOutrasRouter = Router();

receitasOutrasRouter.use(authMiddleware, requireRole('DIRETOR'));
receitasOutrasRouter.get('/', asyncHandler(otherRevenuesController.list));
receitasOutrasRouter.post('/', asyncHandler(otherRevenuesController.create));
