import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

// Middleware central de erro — única saída de erro da API.
// Nunca inclui stack trace nem detalhes internos na resposta (docs/seguranca.md item 5).
export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Erro não tratado:', err instanceof Error ? err.message : err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    },
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
}
