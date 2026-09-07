import { Router } from 'express';
import { categoriasController } from '../controllers/categorias.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const categoriasRouter = Router();

categoriasRouter.use(authMiddleware, requireRole('DIRETOR'));

categoriasRouter.get('/despesas', asyncHandler(categoriasController.listExpense));
categoriasRouter.post('/despesas', asyncHandler(categoriasController.createExpense));
categoriasRouter.patch('/despesas/:id', asyncHandler(categoriasController.updateExpense));

categoriasRouter.get('/receitas', asyncHandler(categoriasController.listRevenue));
categoriasRouter.post('/receitas', asyncHandler(categoriasController.createRevenue));
categoriasRouter.patch('/receitas/:id', asyncHandler(categoriasController.updateRevenue));
