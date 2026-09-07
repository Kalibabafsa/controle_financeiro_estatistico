import { babasRepository } from '../repositories/babas.repository';
import { suspensionsRepository } from '../repositories/suspensions.repository';
import { auditService } from './audit.service';
import { NotFoundError } from '../errors/domain-errors';
import type { LiberarSuspensaoInput } from '../schemas/babas.schemas';

interface ParticipantRef {
  socioId?: string | null;
  convidadoId?: string | null;
}

// ADR-04 — suspensão computável a qualquer momento via função pura, sem job agendado.
export const suspensionService = {
  /**
   * Está suspenso para o baba `targetBabaDate`? Verifica se há Suspension não liberada
   * originada no baba imediatamente anterior ao alvo.
   */
  async isSuspended(participant: ParticipantRef, targetBabaDate: Date): Promise<boolean> {
    const previousBaba = await babasRepository.findPreviousBefore(targetBabaDate);
    if (!previousBaba) return false;

    const suspension = await suspensionsRepository.findActiveForParticipant(
      previousBaba.id,
      participant.socioId ?? undefined,
      participant.convidadoId ?? undefined
    );

    return suspension !== null;
  },

  listActive() {
    return suspensionsRepository.findAllActive();
  },

  listAll() {
    return suspensionsRepository.findAll();
  },

  async liberar(id: string, input: LiberarSuspensaoInput, actorUserId: string) {
    const suspension = await suspensionsRepository.findById(id);
    if (!suspension) throw new NotFoundError('Suspensão', id);

    const updated = await suspensionsRepository.lift(id, actorUserId, input.reason);

    await auditService.log({
      actorUserId,
      action: 'suspensao.liberar',
      entityType: 'Suspension',
      entityId: id,
      metadata: { reason: input.reason },
    });

    return updated;
  },
};
