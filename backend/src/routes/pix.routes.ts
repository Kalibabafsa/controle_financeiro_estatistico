import { Router } from 'express';
import { pixController } from '../controllers/pix.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const pixRouter = Router();

pixRouter.use(authMiddleware);
pixRouter.get('/payload', asyncHandler(pixController.getPayload));
