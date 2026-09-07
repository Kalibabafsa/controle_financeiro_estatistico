import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

// select mínimo em vez de include completo (security-report.md A1 — vazamento de PII):
// Socio/Convidado têm email/phone, que não devem viajar em rotas de leitura de eventos
// (acessíveis a qualquer sócio autenticado, não só ao diretor). Nunca usar `include: { socio: true }`
// nestes models — sempre `select: { id, name }`.
const SAFE_PARTICIPANT_SELECT = { select: { id: true, name: true } } as const;

const EVENT_SELECT = {
  id: true,
  babaDoDiaId: true,
  presencaId: true,
  teamId: true,
  type: true,
  registeredBy: true,
  createdAt: true,
  presenca: {
    select: {
      id: true,
      participantType: true,
      position: true,
      socio: SAFE_PARTICIPANT_SELECT,
      convidado: SAFE_PARTICIPANT_SELECT,
    },
  },
} satisfies Prisma.GameEventSelect;

export const gameEventsRepository = {
  findByBabaId(babaDoDiaId: string) {
    return prisma.gameEvent.findMany({
      where: { babaDoDiaId },
      select: EVENT_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.gameEvent.findUnique({
      where: { id },
      include: { presenca: true, babaDoDia: true, suspension: true },
    });
  },

  create(data: Prisma.GameEventCreateInput) {
    return prisma.gameEvent.create({ data, include: { presenca: true } });
  },

  delete(id: string) {
    return prisma.gameEvent.delete({ where: { id } });
  },

  // Para rankings — todos os eventos de uma temporada (ano civil, RF35), com dados do sócio.
  // Mesmo que hoje o rankingsService só reaproveite id/name, o select mínimo evita over-fetch
  // por construção (não depende do service "lembrar" de filtrar antes de responder).
  findBySeasonAndType(season: number, type: Prisma.EnumEventTypeFilter | undefined) {
    const start = new Date(Date.UTC(season, 0, 1));
    const end = new Date(Date.UTC(season + 1, 0, 1));
    return prisma.gameEvent.findMany({
      where: {
        type: type,
        babaDoDia: { date: { gte: start, lt: end } },
        presenca: { participantType: 'SOCIO' }, // convidados não entram em rankings (RF9)
      },
      select: {
        id: true,
        type: true,
        presenca: { select: { socio: SAFE_PARTICIPANT_SELECT } },
      },
    });
  },
};
