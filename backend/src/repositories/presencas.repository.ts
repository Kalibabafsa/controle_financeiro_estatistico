import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export const presencasRepository = {
  findByBabaId(babaDoDiaId: string) {
    return prisma.presenca.findMany({
      where: { babaDoDiaId },
      select: {
        id: true,
        babaDoDiaId: true,
        participantType: true,
        socioId: true,
        convidadoId: true,
        position: true,
        createdAt: true,
        socio: { select: { id: true, name: true } },
        convidado: { select: { id: true, name: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.presenca.findUnique({
      where: { id },
      select: {
        id: true,
        babaDoDiaId: true,
        participantType: true,
        socioId: true,
        convidadoId: true,
        position: true,
        createdAt: true,
        socio: { select: { id: true, name: true } },
        convidado: { select: { id: true, name: true } },
      },
    });
  },

  // Substitui a lista de presença inteira em uma transação (arquitetura define
  // PUT /babas/:id/presenca como "substitui" — não é PATCH incremental).
  //
  // Correção do bug 🔴 #1 (code-review.md): TeamMember.presencaId e GameEvent.presencaId
  // são relações obrigatórias sem `onDelete: Cascade` (default do Postgres/Prisma é RESTRICT),
  // então um `deleteMany` cego em Presenca falhava com P2003 sempre que o baba já tinha
  // sorteio de times ou eventos registrados. Aqui apagamos explicitamente, na mesma transação
  // e na ordem correta de dependência (Suspension -> GameEvent/TeamMember -> Presenca), os
  // vínculos das presenças que serão substituídas antes de recriá-las — opção (a) sugerida
  // pelo code review. O service (presenca.service.ts) registra em AuditLog quando essa
  // substituição de fato removeu times/eventos já lançados (perda de dado, RNF5/RNF8).
  async replaceAll(babaDoDiaId: string, participants: Prisma.PresencaCreateManyInput[]) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.presenca.findMany({ where: { babaDoDiaId }, select: { id: true } });
      const existingIds = existing.map((p) => p.id);

      if (existingIds.length > 0) {
        // Suspension referencia GameEvent (FK obrigatória e única) — precisa sair primeiro.
        await tx.suspension.deleteMany({ where: { originEvent: { presencaId: { in: existingIds } } } });
        await tx.gameEvent.deleteMany({ where: { presencaId: { in: existingIds } } });
        await tx.teamMember.deleteMany({ where: { presencaId: { in: existingIds } } });
      }

      await tx.presenca.deleteMany({ where: { babaDoDiaId } });
      if (participants.length > 0) {
        await tx.presenca.createMany({ data: participants });
      }
      return tx.presenca.findMany({
        where: { babaDoDiaId },
        select: {
          id: true,
          babaDoDiaId: true,
          participantType: true,
          socioId: true,
          convidadoId: true,
          position: true,
          createdAt: true,
          socio: { select: { id: true, name: true } },
          convidado: { select: { id: true, name: true } },
        },
      });
    });
  },

  // Usado pelo service para decidir se a substituição de presença vai derrubar times/eventos
  // já lançados (para registrar em AuditLog antes de executar `replaceAll`).
  async countDependents(babaDoDiaId: string): Promise<{ teamMembers: number; gameEvents: number }> {
    const [teamMembers, gameEvents] = await Promise.all([
      prisma.teamMember.count({ where: { presenca: { babaDoDiaId } } }),
      prisma.gameEvent.count({ where: { babaDoDiaId } }),
    ]);
    return { teamMembers, gameEvents };
  },

  // Ranking de presença por temporada (RF34) — só sócios entram (RF9), convidados nunca.
  // Extraído para cá a partir de rankings.service.ts (code-review.md 🟡 #3 — service não
  // deve importar Prisma diretamente).
  findBySeasonForSocios(season: number) {
    const start = new Date(Date.UTC(season, 0, 1));
    const end = new Date(Date.UTC(season + 1, 0, 1));
    return prisma.presenca.findMany({
      where: { participantType: 'SOCIO', babaDoDia: { date: { gte: start, lt: end } } },
      select: { socio: { select: { id: true, name: true } } },
    });
  },
};
