import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const authRouter = Router();

authRouter.post('/login', authRateLimiter, asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', authMiddleware, asyncHandler(authController.logout));
authRouter.post('/forgot-password', authRateLimiter, asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', authRateLimiter, asyncHandler(authController.resetPassword));
