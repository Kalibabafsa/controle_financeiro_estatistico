import { presencasRepository } from '../repositories/presencas.repository';
import { babasRepository } from '../repositories/babas.repository';
import { suspensionService } from './suspension.service';
import { auditService } from './audit.service';
import { NotFoundError, ConflictError } from '../errors/domain-errors';
import type { SetPresencaInput } from '../schemas/babas.schemas';

export const presencaService = {
  findByBabaId(babaDoDiaId: string) {
    return presencasRepository.findByBabaId(babaDoDiaId);
  },

  async setPresenca(babaDoDiaId: string, input: SetPresencaInput, actorUserId: string) {
    const baba = await babasRepository.findById(babaDoDiaId);
    if (!baba) throw new NotFoundError('Baba do dia', babaDoDiaId);

    // Bloqueia suspensos por cartão vermelho no baba imediatamente anterior (ADR-04/RF30).
    // Para liberar, o diretor deve usar POST /suspensoes/:id/liberar antes de tentar de novo.
    for (const participant of input.participants) {
      const suspended = await suspensionService.isSuspended(
        { socioId: participant.socioId, convidadoId: participant.convidadoId },
        baba.date
      );
      if (suspended) {
        throw new ConflictError(
          `Participante suspenso para este baba (cartão vermelho no baba anterior). Libere a suspensão antes de escalar.`
        );
      }
    }

    // RNF5/RNF8 — substituir a lista de presença apaga (via cascade explícito, ver
    // presencasRepository.replaceAll) qualquer time/evento já lançado para as presenças
    // atuais do baba. Registra em auditoria SEMPRE que isso de fato acontecer, para nunca
    // perder rastro de um lançamento removido silenciosamente.
    const dependents = await presencasRepository.countDependents(babaDoDiaId);

    const participants = input.participants.map((p) => ({
      babaDoDiaId,
      participantType: p.type,
      socioId: p.type === 'SOCIO' ? p.socioId : undefined,
      convidadoId: p.type === 'CONVIDADO' ? p.convidadoId : undefined,
      position: p.position,
    }));

    const result = await presencasRepository.replaceAll(babaDoDiaId, participants);

    if (dependents.teamMembers > 0 || dependents.gameEvents > 0) {
      await auditService.log({
        actorUserId,
        action: 'presenca.replace_com_perda_de_dados',
        entityType: 'BabaDoDia',
        entityId: babaDoDiaId,
        metadata: {
          teamMembersRemovidos: dependents.teamMembers,
          gameEventsRemovidos: dependents.gameEvents,
        },
      });
    } else {
      await auditService.log({
        actorUserId,
        action: 'presenca.replace',
        entityType: 'BabaDoDia',
        entityId: babaDoDiaId,
      });
    }

    return result;
  },
};
