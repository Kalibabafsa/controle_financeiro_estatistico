import { prisma } from '../lib/prisma';

export interface TeamAssignment {
  number: number;
  presencaIds: string[];
}

// select mínimo (defesa em profundidade, mesmo padrão de gameEvents/presencas.repository.ts) —
// estas rotas são exclusivas de DIRETOR hoje (menor severidade que o A1 do security-report.md,
// mas sem motivo para trafegar email/phone além do necessário).
const SAFE_PARTICIPANT_SELECT = { select: { id: true, name: true } } as const;

const TEAM_SELECT = {
  id: true,
  babaDoDiaId: true,
  number: true,
  members: {
    select: {
      id: true,
      presenca: {
        select: {
          id: true,
          participantType: true,
          position: true,
          socio: SAFE_PARTICIPANT_SELECT,
          convidado: SAFE_PARTICIPANT_SELECT,
        },
      },
    },
  },
} as const;

export const teamsRepository = {
  findByBabaId(babaDoDiaId: string) {
    return prisma.team.findMany({
      where: { babaDoDiaId },
      select: TEAM_SELECT,
      orderBy: { number: 'asc' },
    });
  },

  // Substitui os times inteiros de um baba (sorteio ou ajuste manual).
  async replaceAll(babaDoDiaId: string, assignments: TeamAssignment[]) {
    return prisma.$transaction(async (tx) => {
      await tx.teamMember.deleteMany({ where: { team: { babaDoDiaId } } });
      await tx.team.deleteMany({ where: { babaDoDiaId } });

      for (const assignment of assignments) {
        const team = await tx.team.create({ data: { babaDoDiaId, number: assignment.number } });
        if (assignment.presencaIds.length > 0) {
          await tx.teamMember.createMany({
            data: assignment.presencaIds.map((presencaId) => ({ teamId: team.id, presencaId })),
          });
        }
      }

      return tx.team.findMany({
        where: { babaDoDiaId },
        select: TEAM_SELECT,
        orderBy: { number: 'asc' },
      });
    });
  },
};
