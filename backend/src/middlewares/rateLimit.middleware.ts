import rateLimit from 'express-rate-limit';
import { env } from '../lib/env';

// Rate limit global, aplicado em app.ts a todas as rotas /api.
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Muitas requisições. Tente novamente em instantes.' } },
});

// Rate limit reforçado para rotas sensíveis (login, reset de senha) — docs/seguranca.md item 2/6.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Muitas tentativas. Tente novamente em instantes.' } },
});
