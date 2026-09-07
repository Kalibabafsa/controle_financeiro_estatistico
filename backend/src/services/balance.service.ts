import { Prisma } from '@prisma/client';
import { socioPaymentsRepository } from '../repositories/socioPayments.repository';
import { guestPaymentsRepository } from '../repositories/guestPayments.repository';
import { otherRevenuesRepository } from '../repositories/revenueCategories.repository';
import { expensesRepository } from '../repositories/expenses.repository';
import { monthlyClosingBalanceRepository } from '../repositories/monthlyClosingBalance.repository';
import { toReferenceMonth } from '../lib/date';

// ADR-03 — saldo acumulado materializado, recalculado em cascata (não do zero a cada leitura).
export const balanceService = {
  /**
   * Recalcula o mês informado (soma de receitas/despesas do zero, a partir dos lançamentos)
   * e propaga a mudança de saldo acumulado para os meses futuros já fechados.
   * Deve ser chamado após qualquer escrita em SocioPayment/GuestPayment/OtherRevenue/Expense.
   */
  async recalculateFrom(month: Date): Promise<void> {
    const referenceMonth = toReferenceMonth(month);
    await recalcSingleMonth(referenceMonth);
    await cascadeCumulative(referenceMonth);
  },

  async getSeries(referenceMonth: Date, months: number) {
    // Série dos últimos N meses até referenceMonth (inclusive), para gráfico do dashboard.
    const target = toReferenceMonth(referenceMonth);
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() - i, 1));
      const record = await monthlyClosingBalanceRepository.findByMonth(monthDate);
      results.push({
        referenceMonth: monthDate,
        revenueTotal: record?.revenueTotal ?? new Prisma.Decimal(0),
        expenseTotal: record?.expenseTotal ?? new Prisma.Decimal(0),
        monthBalance: record?.monthBalance ?? new Prisma.Decimal(0),
        cumulativeBalance: record?.cumulativeBalance ?? new Prisma.Decimal(0),
      });
    }
    return results;
  },
};

async function recalcSingleMonth(referenceMonth: Date): Promise<void> {
  const [socioTotal, guestTotal, otherTotal, expenseTotal] = await Promise.all([
    socioPaymentsRepository.sumByMonth(referenceMonth),
    guestPaymentsRepository.sumByMonth(referenceMonth),
    otherRevenuesRepository.sumByMonth(referenceMonth),
    expensesRepository.sumByMonth(referenceMonth),
  ]);

  const revenueTotal = socioTotal.plus(guestTotal).plus(otherTotal);
  const monthBalance = revenueTotal.minus(expenseTotal);

  const previous = await monthlyClosingBalanceRepository.findLatestBefore(referenceMonth);
  const previousCumulative = previous?.cumulativeBalance ?? new Prisma.Decimal(0);
  const cumulativeBalance = previousCumulative.plus(monthBalance);

  await monthlyClosingBalanceRepository.upsert(referenceMonth, {
    revenueTotal,
    expenseTotal,
    monthBalance,
    cumulativeBalance,
  });
}

async function cascadeCumulative(fromMonth: Date): Promise<void> {
  let previous = await monthlyClosingBalanceRepository.findByMonth(fromMonth);
  let cursor = fromMonth;

  // Propaga só o cumulativeBalance para meses futuros já fechados — o custo é
  // O(meses futuros já registrados), nunca O(todo o histórico).
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const next = await monthlyClosingBalanceRepository.findNextAfter(cursor);
    if (!next || !previous) break;

    const newCumulative = previous.cumulativeBalance.plus(next.monthBalance);
    const updated = await monthlyClosingBalanceRepository.upsert(next.referenceMonth, {
      revenueTotal: next.revenueTotal,
      expenseTotal: next.expenseTotal,
      monthBalance: next.monthBalance,
      cumulativeBalance: newCumulative,
    });

    previous = updated;
    cursor = next.referenceMonth;
  }
}
