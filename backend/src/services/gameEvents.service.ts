import { gameEventsRepository } from '../repositories/gameEvents.repository';
import { presencasRepository } from '../repositories/presencas.repository';
import { suspensionsRepository } from '../repositories/suspensions.repository';
import { babasRepository } from '../repositories/babas.repository';
import { auditService } from './audit.service';
import { NotFoundError } from '../errors/domain-errors';
import type { CreateGameEventInput } from '../schemas/babas.schemas';

const SUSPENSION_OFFSET_MS = 7 * 24 * 60 * 60 * 1000;

export const gameEventsService = {
  findByBabaId(babaDoDiaId: string) {
    return gameEventsRepository.findByBabaId(babaDoDiaId);
  },

  async create(babaDoDiaId: string, input: CreateGameEventInput, actorUserId: string) {
    const baba = await babasRepository.findById(babaDoDiaId);
    if (!baba) throw new NotFoundError('Baba do dia', babaDoDiaId);

    const presenca = await presencasRepository.findById(input.presencaId);
    if (!presenca || presenca.babaDoDiaId !== babaDoDiaId) {
      throw new NotFoundError('Presença', input.presencaId);
    }

    const event = await gameEventsRepository.create({
      babaDoDia: { connect: { id: babaDoDiaId } },
      presenca: { connect: { id: input.presencaId } },
      team: input.teamId ? { connect: { id: input.teamId } } : undefined,
      type: input.type,
      registeredBy: actorUserId,
    });

    // RF30/ADR-04 — cartão vermelho materializa a suspensão para o próximo domingo (+7 dias
    // como aproximação; a checagem real usa o baba imediatamente seguinte, não a data calendário).
    if (input.type === 'CARTAO_VERMELHO') {
      const effectiveDate = new Date(baba.date.getTime() + SUSPENSION_OFFSET_MS);

      await suspensionsRepository.create({
        originEvent: { connect: { id: event.id } },
        socio: presenca.socioId ? { connect: { id: presenca.socioId } } : undefined,
        convidado: presenca.convidadoId ? { connect: { id: presenca.convidadoId } } : undefined,
        effectiveDate,
      });
    }

    await auditService.log({
      actorUserId,
      action: 'evento.create',
      entityType: 'GameEvent',
      entityId: event.id,
      metadata: { type: input.type, presencaId: input.presencaId },
    });

    return event;
  },

  async delete(id: string, actorUserId: string) {
    const event = await gameEventsRepository.findById(id);
    if (!event) throw new NotFoundError('Evento', id);

    if (event.suspension) {
      await suspensionsRepository.deleteByOriginEventId(id);
    }
    await gameEventsRepository.delete(id);

    await auditService.log({ actorUserId, action: 'evento.delete', entityType: 'GameEvent', entityId: id });
  },
};
