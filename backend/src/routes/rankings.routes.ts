import { Router } from 'express';
import { rankingsController } from '../controllers/rankings.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const rankingsRouter = Router();

rankingsRouter.use(authMiddleware);
rankingsRouter.get('/', asyncHandler(rankingsController.get));
