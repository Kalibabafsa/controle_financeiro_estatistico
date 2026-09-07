import { Prisma } from '@prisma/client';
import { guestPaymentsRepository } from '../repositories/guestPayments.repository';
import { systemConfigRepository } from '../repositories/systemConfig.repository';
import { convidadosRepository } from '../repositories/convidados.repository';
import { balanceService } from './balance.service';
import { auditService } from './audit.service';
import { NotFoundError } from '../errors/domain-errors';
import { toReferenceMonth } from '../lib/date';
import type { CreatePagamentoConvidadoInput, ListPagamentosConvidadosQuery } from '../schemas/financeiro.schemas';

export const pagamentosConvidadosService = {
  list(query: ListPagamentosConvidadosQuery) {
    return guestPaymentsRepository.findMany({
      convidadoId: query.convidadoId,
      matchDate: query.month
        ? {
            gte: toReferenceMonth(query.month),
            lt: new Date(
              Date.UTC(toReferenceMonth(query.month).getUTCFullYear(), toReferenceMonth(query.month).getUTCMonth() + 1, 1)
            ),
          }
        : undefined,
    });
  },

  async create(input: CreatePagamentoConvidadoInput, actorUserId: string) {
    const convidado = await convidadosRepository.findById(input.convidadoId);
    if (!convidado) throw new NotFoundError('Convidado', input.convidadoId);

    const config = await systemConfigRepository.get();
    const amount = new Prisma.Decimal(input.amount ?? config.defaultGuestFee);

    const payment = await guestPaymentsRepository.create({
      convidado: { connect: { id: input.convidadoId } },
      babaDoDia: input.babaDoDiaId ? { connect: { id: input.babaDoDiaId } } : undefined,
      matchDate: input.matchDate,
      amount,
      paymentMethod: input.paymentMethod,
      paidAt: input.paidAt,
      registeredBy: actorUserId,
    });

    await balanceService.recalculateFrom(toReferenceMonth(input.matchDate));

    await auditService.log({
      actorUserId,
      action: 'pagamento_convidado.create',
      entityType: 'GuestPayment',
      entityId: payment.id,
      metadata: { convidadoId: input.convidadoId, matchDate: input.matchDate.toISOString(), amount: amount.toString() },
    });

    return payment;
  },
};
