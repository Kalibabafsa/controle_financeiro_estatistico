import { Router } from 'express';
import { despesasController } from '../controllers/despesas.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { uploadAttachment } from '../middlewares/upload.middleware';
import { asyncHandler } from '../lib/asyncHandler';

export const despesasRouter = Router();

despesasRouter.use(authMiddleware, requireRole('DIRETOR'));
despesasRouter.get('/', asyncHandler(despesasController.list));
despesasRouter.post('/', uploadAttachment.single('attachment'), asyncHandler(despesasController.create));
despesasRouter.get('/:id/anexo', asyncHandler(despesasController.getAnexo));
