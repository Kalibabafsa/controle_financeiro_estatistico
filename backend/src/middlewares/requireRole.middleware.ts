import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../errors/domain-errors';

// Checa o papel do usuário autenticado. Deve vir sempre depois de authMiddleware.
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Papel do usuário não autorizado para esta ação.');
    }
    next();
  };
}
