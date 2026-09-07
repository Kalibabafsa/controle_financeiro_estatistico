import { otherRevenuesRepository } from '../repositories/revenueCategories.repository';
import { balanceService } from './balance.service';
import { auditService } from './audit.service';
import { toReferenceMonth } from '../lib/date';
import type { CreateOtherRevenueInput } from '../schemas/financeiro.schemas';

export const otherRevenuesService = {
  listByMonth(month: Date) {
    return otherRevenuesRepository.findByMonth(toReferenceMonth(month));
  },

  async create(input: CreateOtherRevenueInput, actorUserId: string) {
    const referenceMonth = toReferenceMonth(input.referenceMonth);

    const revenue = await otherRevenuesRepository.create({
      category: { connect: { id: input.categoryId } },
      referenceMonth,
      amount: input.amount,
      description: input.description,
      registeredBy: actorUserId,
    });

    await balanceService.recalculateFrom(referenceMonth);

    await auditService.log({
      actorUserId,
      action: 'receita_outra.create',
      entityType: 'OtherRevenue',
      entityId: revenue.id,
      metadata: { referenceMonth: referenceMonth.toISOString(), amount: input.amount },
    });

    return revenue;
  },
};
