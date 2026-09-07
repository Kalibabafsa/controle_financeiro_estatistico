import { presencasRepository } from '../repositories/presencas.repository';
import { teamsRepository, type TeamAssignment } from '../repositories/teams.repository';
import { babasRepository } from '../repositories/babas.repository';
import { NotFoundError, ConflictError } from '../errors/domain-errors';
import type { SetTimesInput } from '../schemas/babas.schemas';

const NUMBER_OF_TEAMS = 4;

function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export const sorteioService = {
  /**
   * Sorteia os presentes do baba em 4 times, distribuindo goleiros e jogadores de
   * linha em round-robin (1 goleiro + até 6 de linha por time, RF27). Se o número de
   * presentes não fechar exatamente 28, a distribuição fica o mais equilibrada possível.
   */
  async sortear(babaDoDiaId: string) {
    const baba = await babasRepository.findById(babaDoDiaId);
    if (!baba) throw new NotFoundError('Baba do dia', babaDoDiaId);

    const presencas = await presencasRepository.findByBabaId(babaDoDiaId);
    if (presencas.length === 0) {
      throw new ConflictError('Não há presença registrada para sortear times.');
    }

    const goleiros = shuffle(presencas.filter((p) => p.position === 'GOLEIRO'));
    const linha = shuffle(presencas.filter((p) => p.position === 'LINHA'));

    const assignments: TeamAssignment[] = Array.from({ length: NUMBER_OF_TEAMS }, (_, i) => ({
      number: i + 1,
      presencaIds: [] as string[],
    }));

    goleiros.forEach((presenca, index) => {
      assignments[index % NUMBER_OF_TEAMS].presencaIds.push(presenca.id);
    });

    linha.forEach((presenca, index) => {
      assignments[index % NUMBER_OF_TEAMS].presencaIds.push(presenca.id);
    });

    return teamsRepository.replaceAll(babaDoDiaId, assignments);
  },

  async saveManual(babaDoDiaId: string, input: SetTimesInput) {
    const baba = await babasRepository.findById(babaDoDiaId);
    if (!baba) throw new NotFoundError('Baba do dia', babaDoDiaId);

    return teamsRepository.replaceAll(babaDoDiaId, input.teams);
  },

  getByBabaId(babaDoDiaId: string) {
    return teamsRepository.findByBabaId(babaDoDiaId);
  },
};
