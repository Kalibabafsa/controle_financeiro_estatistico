import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Valida as variáveis de ambiente uma única vez, na subida do processo.
// Falha rápido (fail-fast) se algo obrigatório estiver faltando — evita
// comportamento indefinido em produção por segredo ausente.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  DIRECT_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET deve ter ao menos 16 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET deve ter ao menos 16 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  // Sem default (corrigido em /seguranca): um fallback hardcoded e versionado quebraria o
  // padrão fail-fast dos demais segredos — se a env não fosse configurada em produção por
  // engano, o processo subiria "normalmente" assinando cookies com um valor público e
  // previsível (visível no código-fonte). Ver docs/planning/security-report.md.
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET deve ter ao menos 16 caracteres'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET_COMPROVANTES: z.string().default('comprovantes'),
  SUPABASE_STORAGE_BUCKET_RELATORIOS: z.string().default('relatorios-pdf'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  // Nº de proxies reversos confiáveis na frente do processo Node (Render normalmente usa 1
  // hop). Sem isso, o Express usa o IP do proxy como req.ip para TODAS as requisições —
  // security-report.md A2: rate limiting por IP fica inútil (um balde único compartilhado
  // por todo mundo). Ver app.set('trust proxy', ...) em app.ts.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  PIX_INTEGRATION_MODE: z.enum(['manual', 'inter']).default('manual'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuração de ambiente inválida — veja .env.example');
}

export const env = parsed.data;

export const corsAllowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
