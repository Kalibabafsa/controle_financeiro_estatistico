import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

// Única camada que fala com o Prisma para o model User.
export const usersRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: { socio: true } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { socio: true } });
  },

  updateLastLogin(id: string) {
    return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },

  updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
};
