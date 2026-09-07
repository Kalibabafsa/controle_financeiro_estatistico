import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt';
import { UnauthorizedError } from '../errors/domain-errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

// Valida o JWT de acesso (Bearer) e popula req.user.
// Toda rota protegida passa por aqui antes de qualquer controller (docs/seguranca.md item 3).
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acesso ausente.');
  }

  const token = header.slice('Bearer '.length);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedError('Token de acesso inválido ou expirado.');
  }
}
