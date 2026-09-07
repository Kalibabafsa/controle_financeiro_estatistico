import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const convidadosRepository = {
  findMany(where: Prisma.ConvidadoWhereInput, skip: number, take: number) {
    return prisma.convidado.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: { invitedBy: { select: { id: true, name: true } } },
    });
  },

  count(where: Prisma.ConvidadoWhereInput) {
    return prisma.convidado.count({ where });
  },

  findById(id: string) {
    return prisma.convidado.findUnique({
      where: { id },
      include: {
        invitedBy: { select: { id: true, name: true } },
        payments: { orderBy: { matchDate: 'desc' } },
        presencas: { orderBy: { createdAt: 'desc' }, include: { babaDoDia: true } },
      },
    });
  },

  create(data: Prisma.ConvidadoCreateInput) {
    return prisma.convidado.create({ data });
  },

  update(id: string, data: Prisma.ConvidadoUpdateInput) {
    return prisma.convidado.update({ where: { id }, data });
  },

  anonymizeContact(id: string) {
    return prisma.convidado.update({
      where: { id },
      data: { name: 'Convidado removido', phone: null, contactRemovedAt: new Date() },
    });
  },
};
