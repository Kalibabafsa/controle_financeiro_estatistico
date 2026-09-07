import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsAllowedOrigins, env } from './lib/env';
import { globalRateLimiter } from './middlewares/rateLimit.middleware';
import { errorHandlerMiddleware, notFoundMiddleware } from './middlewares/errorHandler.middleware';
import { apiRouter } from './routes';

export function createApp(): Express {
  const app = express();

  // security-report.md A2 — sem isso, atrás do proxy reverso do Render, o Express usa o IP
  // do proxy (igual para todo mundo) como req.ip, e o rate limiting por IP (login, global)
  // vira um balde único compartilhado por todos os usuários — uma pessoa errando a senha
  // 10x bloqueia o login de todo mundo por 15min. `TRUST_PROXY_HOPS` (padrão 1) reflete a
  // topologia real de proxy confiável na frente do processo.
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  app.use(helmet());
  app.use(
    cors({
      origin: corsAllowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use('/api', globalRateLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
