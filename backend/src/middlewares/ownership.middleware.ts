import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/domain-errors';

// Garante que rotas com :id de sócio só sejam acessadas pelo DIRETOR ou pelo
// próprio sócio dono do recurso (ADR-08) — mitigação de IDOR em profundidade,
// além do padrão /me/* preferido para autoatendimento.
export function requireOwnerOrDirector(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const targetId = req.params[paramName];

    if (req.user.role === 'DIRETOR' || req.user.socioId === targetId) {
      next();
      return;
    }

    throw new ForbiddenError('Você só pode acessar seus próprios dados.');
  };
}
