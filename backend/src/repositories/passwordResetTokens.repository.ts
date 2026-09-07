import { prisma } from '../lib/prisma';

export const passwordResetTokensRepository = {
  create(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
  },

  findValidByHash(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  markUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },
};
