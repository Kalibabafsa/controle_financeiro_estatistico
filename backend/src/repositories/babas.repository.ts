import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

// select mínimo (mesma correção do security-report.md A1 aplicada a gameEvents/presencas/teams
// .repository.ts) — GET /babas/:id é acessível a Diretor + Sócio; o detalhe completo do baba
// (presenças, times, eventos) nunca deveria trafegar email/phone de outros sócios/convidados.
const SAFE_PARTICIPANT_SELECT = { select: { id: true, name: true } } as const;

const PRESENCA_SELECT = {
  id: true,
  participantType: true,
  socioId: true,
  convidadoId: true,
  position: true,
  socio: SAFE_PARTICIPANT_SELECT,
  convidado: SAFE_PARTICIPANT_SELECT,
} as const;

export const babasRepository = {
  findMany(skip: number, take: number) {
    return prisma.babaDoDia.findMany({
      skip,
      take,
      orderBy: { date: 'desc' },
    });
  },

  count() {
    return prisma.babaDoDia.count();
  },

  countBySeason(season: number) {
    const start = new Date(Date.UTC(season, 0, 1));
    const end = new Date(Date.UTC(season + 1, 0, 1));
    return prisma.babaDoDia.count({ where: { date: { gte: start, lt: end } } });
  },

  findById(id: string) {
    return prisma.babaDoDia.findUnique({
      where: { id },
      select: {
        id: true,
        date: true,
        time: true,
        location: true,
        createdBy: true,
        createdAt: true,
        presencas: { select: { ...PRESENCA_SELECT, teamMember: { select: { id: true, teamId: true } } } },
        teams: {
          select: {
            id: true,
            babaDoDiaId: true,
            number: true,
            members: { select: { id: true, presenca: { select: PRESENCA_SELECT } } },
          },
          orderBy: { number: 'asc' },
        },
        events: {
          select: {
            id: true,
            babaDoDiaId: true,
            teamId: true,
            type: true,
            registeredBy: true,
            createdAt: true,
            presenca: { select: PRESENCA_SELECT },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  findByDate(date: Date) {
    return prisma.babaDoDia.findUnique({ where: { date } });
  },

  // Baba imediatamente anterior a uma data (usado pela regra de suspensão, ADR-04).
  findPreviousBefore(date: Date) {
    return prisma.babaDoDia.findFirst({
      where: { date: { lt: date } },
      orderBy: { date: 'desc' },
    });
  },

  findNextFrom(date: Date) {
    return prisma.babaDoDia.findFirst({
      where: { date: { gte: date } },
      orderBy: { date: 'asc' },
    });
  },

  create(data: Prisma.BabaDoDiaCreateInput) {
    return prisma.babaDoDia.create({ data });
  },

  update(id: string, data: Prisma.BabaDoDiaUpdateInput) {
    return prisma.babaDoDia.update({ where: { id }, data });
  },
};
