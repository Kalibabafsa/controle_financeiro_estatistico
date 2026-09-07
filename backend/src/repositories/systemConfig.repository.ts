import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const CONFIG_ID = 1;

export const systemConfigRepository = {
  async get() {
    const config = await prisma.systemConfig.findUnique({ where: { id: CONFIG_ID } });
    if (config) return config;

    // Auto-cria a linha única de configuração com defaults do PRD (RF36) se ainda não existir.
    return prisma.systemConfig.create({
      data: { id: CONFIG_ID, defaultMonthlyFee: 110, defaultGuestFee: 30, currentSeason: new Date().getFullYear() },
    });
  },

  update(data: Prisma.SystemConfigUpdateInput) {
    return prisma.systemConfig.update({ where: { id: CONFIG_ID }, data });
  },
};
