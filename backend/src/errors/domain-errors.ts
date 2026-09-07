import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(`${entity} não encontrado${id ? ` (id: ${id})` : ''}.`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Credenciais inválidas.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Você não tem permissão para acessar este recurso.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}
