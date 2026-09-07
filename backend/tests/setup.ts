// Executado antes de qualquer arquivo de teste (vitest.config.ts -> setupFiles).
// Define variáveis de ambiente determinísticas para que `src/lib/env.ts` (fail-fast)
// não quebre a suíte e para que testes nunca dependam de configuração local/.env real.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/kalibaba_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789abcdef';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789abcdef';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.COOKIE_SECRET = 'test-cookie-secret-0123456789abcdef';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.PIX_INTEGRATION_MODE = 'manual';
process.env.RATE_LIMIT_MAX = '10000'; // suíte não deve ser afetada pelo rate limiter global
