import { Prisma } from '@prisma/client';
import { socioPaymentsRepository } from '../repositories/socioPayments.repository';
import { systemConfigRepository } from '../repositories/systemConfig.repository';
import { sociosRepository } from '../repositories/socios.repository';
import { balanceService } from './balance.service';
import { auditService } from './audit.service';
import { ConflictError, NotFoundError } from '../errors/domain-errors';
import { toReferenceMonth } from '../lib/date';
import type { CreateMensalidadeInput, ListMensalidadesQuery } from '../schemas/financeiro.schemas';

export const mensalidadesService = {
  async list(query: ListMensalidadesQuery) {
    return socioPaymentsRepository.findMany({
      socioId: query.socioId,
      referenceMonth: query.month ? toReferenceMonth(query.month) : undefined,
    });
  },

  async create(input: CreateMensalidadeInput, actorUserId: string) {
    const socio = await sociosRepository.findById(input.socioId);
    if (!socio) throw new NotFoundError('Sócio', input.socioId);

    const referenceMonth = toReferenceMonth(input.referenceMonth);

    const existing = await socioPaymentsRepository.findBySocioAndMonth(input.socioId, referenceMonth);
    if (existing) {
      throw new ConflictError('Já existe lançamento de mensalidade para este sócio neste mês.');
    }

    const config = await systemConfigRepository.get();
    const amount = new Prisma.Decimal(input.amount ?? config.defaultMonthlyFee);

    const payment = await socioPaymentsRepository.create({
      socio: { connect: { id: input.socioId } },
      referenceMonth,
      amount,
      paymentMethod: input.paymentMethod,
      paidAt: input.paidAt,
      registeredBy: actorUserId,
    });

    await balanceService.recalculateFrom(referenceMonth);

    await auditService.log({
      actorUserId,
      action: 'mensalidade.create',
      entityType: 'SocioPayment',
      entityId: payment.id,
      metadata: { socioId: input.socioId, referenceMonth: referenceMonth.toISOString(), amount: amount.toString() },
    });

    return payment;
  },

  meHistory(socioId: string, year?: number) {
    return socioPaymentsRepository.findBySocio(socioId, year);
  },
};
