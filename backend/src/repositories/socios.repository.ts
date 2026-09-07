import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const sociosRepository = {
  findMany(where: Prisma.SocioWhereInput, skip: number, take: number) {
    return prisma.socio.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
    });
  },

  count(where: Prisma.SocioWhereInput) {
    return prisma.socio.count({ where });
  },

  findAllActiveIds() {
    // "Ativo" aqui é resolvido pelo service (carry-forward), então trazemos todos com histórico.
    // `phone` incluído para a visão detalhada de inadimplência (diretor) — nunca exposto pelo
    // método `inadimplenciaService.getInadimplentes` (mantido minimal, ver seu teste dedicado).
    return prisma.socio.findMany({ select: { id: true, name: true, phone: true } });
  },

  findById(id: string) {
    return prisma.socio.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.socio.findUnique({ where: { email } });
  },

  create(data: Prisma.SocioCreateInput) {
    return prisma.socio.create({ data });
  },

  update(id: string, data: Prisma.SocioUpdateInput) {
    return prisma.socio.update({ where: { id }, data });
  },
};

export const socioStatusRepository = {
  findExactMonth(socioId: string, referenceMonth: Date) {
    return prisma.socioStatusMensal.findUnique({
      where: { socioId_referenceMonth: { socioId, referenceMonth } },
    });
  },

  findMostRecentUpTo(socioId: string, referenceMonth: Date) {
    return prisma.socioStatusMensal.findFirst({
      where: { socioId, referenceMonth: { lte: referenceMonth } },
      orderBy: { referenceMonth: 'desc' },
    });
  },

  findHistory(socioId: string) {
    return prisma.socioStatusMensal.findMany({
      where: { socioId },
      orderBy: { referenceMonth: 'desc' },
    });
  },

  upsert(socioId: string, referenceMonth: Date, status: 'A' | 'DM' | 'I', observation: string | undefined, setBy: string) {
    return prisma.socioStatusMensal.upsert({
      where: { socioId_referenceMonth: { socioId, referenceMonth } },
      create: { socioId, referenceMonth, status, observation, setBy },
      update: { status, observation, setBy },
    });
  },

  // Usado pelo cálculo de inadimplência: status "resolvido" (carry-forward) de vários sócios de uma vez
  // não dá pra fazer em uma query só de forma simples — o service itera com findMostRecentUpTo.
  findAllUpTo(referenceMonth: Date) {
    return prisma.socioStatusMensal.findMany({
      where: { referenceMonth: { lte: referenceMonth } },
      orderBy: { referenceMonth: 'desc' },
    });
  },
};
