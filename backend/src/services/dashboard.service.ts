import { Prisma } from '@prisma/client';
import { socioPaymentsRepository } from '../repositories/socioPayments.repository';
import { guestPaymentsRepository } from '../repositories/guestPayments.repository';
import { otherRevenuesRepository } from '../repositories/revenueCategories.repository';
import { expensesRepository } from '../repositories/expenses.repository';
import { monthlyClosingBalanceRepository } from '../repositories/monthlyClosingBalance.repository';
import { balanceService } from './balance.service';
import { inadimplenciaService } from './inadimplencia.service';
import { toReferenceMonth } from '../lib/date';

export const dashboardService = {
  async getFinanceiro(month: Date) {
    const referenceMonth = toReferenceMonth(month);

    const [socioRevenue, guestRevenue, otherRevenue, expenseTotal, closing, resumo] = await Promise.all([
      socioPaymentsRepository.sumByMonth(referenceMonth),
      guestPaymentsRepository.sumByMonth(referenceMonth),
      otherRevenuesRepository.sumByMonth(referenceMonth),
      expensesRepository.sumByMonth(referenceMonth),
      monthlyClosingBalanceRepository.findByMonth(referenceMonth),
      inadimplenciaService.getResumo(referenceMonth),
    ]);

    const revenueTotal = socioRevenue.plus(guestRevenue).plus(otherRevenue);
    const monthBalance = closing?.monthBalance ?? revenueTotal.minus(expenseTotal);
    const cumulativeBalance = closing?.cumulativeBalance ?? new Prisma.Decimal(0);

    const series = await balanceService.getSeries(referenceMonth, 6);

    return {
      referenceMonth,
      socioRevenue,
      guestRevenue,
      otherRevenue,
      revenueTotal,
      expenseTotal,
      monthBalance,
      cumulativeBalance,
      percentualInadimplencia: resumo.percentualInadimplencia,
      sociosAtivos: resumo.sociosAtivos,
      series,
    };
  },

  async getSituacaoGeral(month: Date) {
    // Sócio vê apenas agregados — nunca a lista nominal de inadimplentes (RSP3).
    const resumo = await inadimplenciaService.getResumo(toReferenceMonth(month));
    return {
      sociosAtivos: resumo.sociosAtivos,
      percentualInadimplencia: resumo.percentualInadimplencia,
    };
  },
};
