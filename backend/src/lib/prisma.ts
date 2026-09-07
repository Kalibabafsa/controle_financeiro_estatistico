import { PrismaClient } from '@prisma/client';

// Único ponto de instanciação do Prisma Client (RNF/convencoes.md).
// Reaproveita a instância em dev (hot-reload) para não esgotar conexões.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}
