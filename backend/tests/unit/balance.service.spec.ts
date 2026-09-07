import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../../src/repositories/socioPayments.repository', () => ({
  socioPaymentsRepository: { sumByMonth: vi.fn() },
}));
vi.mock('../../src/repositories/guestPayments.repository', () => ({
  guestPaymentsRepository: { sumByMonth: vi.fn() },
}));
vi.mock('../../src/repositories/revenueCategories.repository', () => ({
  otherRevenuesRepository: { sumByMonth: vi.fn() },
}));
vi.mock('../../src/repositories/expenses.repository', () => ({
  expensesRepository: { sumByMonth: vi.fn() },
}));
vi.mock('../../src/repositories/monthlyClosingBalance.repository', () => ({
  monthlyClosingBalanceRepository: {
    findByMonth: vi.fn(),
    findLatestBefore: vi.fn(),
    findNextAfter: vi.fn(),
    upsert: vi.fn(),
  },
}));

import { socioPaymentsRepository } from '../../src/repositories/socioPayments.repository';
import { guestPaymentsRepository } from '../../src/repositories/guestPayments.repository';
import { otherRevenuesRepository } from '../../src/repositories/revenueCategories.repository';
import { expensesRepository } from '../../src/repositories/expenses.repository';
import { monthlyClosingBalanceRepository } from '../../src/repositories/monthlyClosingBalance.repository';
import { balanceService } from '../../src/services/balance.service';

const D = (n: number) => new Prisma.Decimal(n);

describe('balanceService.recalculateFrom (ADR-03 — saldo acumulado materializado em cascata)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('US7 — saldo acumulado do mês = saldo acumulado do mês anterior + receitas do mês − despesas do mês', async () => {
    // Mês anterior fechou com saldo acumulado -R$184,01.
    vi.mocked(monthlyClosingBalanceRepository.findLatestBefore).mockResolvedValue({
      referenceMonth: new Date('2026-07-01T00:00:00.000Z'),
      cumulativeBalance: D(-184.01),
    } as never);
    vi.mocked(socioPaymentsRepository.sumByMonth).mockResolvedValue(D(500));
    vi.mocked(guestPaymentsRepository.sumByMonth).mockResolvedValue(D(0));
    vi.mocked(otherRevenuesRepository.sumByMonth).mockResolvedValue(D(0));
    vi.mocked(expensesRepository.sumByMonth).mockResolvedValue(D(300));
    vi.mocked(monthlyClosingBalanceRepository.findByMonth).mockResolvedValue(null);
    vi.mocked(monthlyClosingBalanceRepository.findNextAfter).mockResolvedValue(null);

    await balanceService.recalculateFrom(new Date('2026-08-05'));

    expect(monthlyClosingBalanceRepository.upsert).toHaveBeenCalledWith(
      new Date('2026-08-01T00:00:00.000Z'),
      expect.objectContaining({
        revenueTotal: expect.objectContaining({ d: expect.anything() }),
      })
    );

    const [, payload] = vi.mocked(monthlyClosingBalanceRepository.upsert).mock.calls[0];
    expect((payload.revenueTotal as Prisma.Decimal).toNumber()).toBe(500);
    expect((payload.monthBalance as Prisma.Decimal).toNumber()).toBe(200); // 500 - 300
    expect((payload.cumulativeBalance as Prisma.Decimal).toNumber()).toBeCloseTo(15.99, 2); // -184.01 + 200
  });

  it('soma as 3 fontes de receita (sócio + convidado + outras) antes de subtrair despesas', async () => {
    vi.mocked(monthlyClosingBalanceRepository.findLatestBefore).mockResolvedValue(null);
    vi.mocked(socioPaymentsRepository.sumByMonth).mockResolvedValue(D(1000));
    vi.mocked(guestPaymentsRepository.sumByMonth).mockResolvedValue(D(150));
    vi.mocked(otherRevenuesRepository.sumByMonth).mockResolvedValue(D(50));
    vi.mocked(expensesRepository.sumByMonth).mockResolvedValue(D(400));
    vi.mocked(monthlyClosingBalanceRepository.findByMonth).mockResolvedValue(null);
    vi.mocked(monthlyClosingBalanceRepository.findNextAfter).mockResolvedValue(null);

    await balanceService.recalculateFrom(new Date('2026-01-10'));

    const [, payload] = vi.mocked(monthlyClosingBalanceRepository.upsert).mock.calls[0];
    expect((payload.revenueTotal as Prisma.Decimal).toNumber()).toBe(1200);
    expect((payload.monthBalance as Prisma.Decimal).toNumber()).toBe(800);
    expect((payload.cumulativeBalance as Prisma.Decimal).toNumber()).toBe(800); // sem mês anterior
  });

  it('saldo acumulado pode ficar negativo (associação no vermelho) sem ser truncado em zero', async () => {
    vi.mocked(monthlyClosingBalanceRepository.findLatestBefore).mockResolvedValue({
      referenceMonth: new Date('2026-05-01T00:00:00.000Z'),
      cumulativeBalance: D(-1000),
    } as never);
    vi.mocked(socioPaymentsRepository.sumByMonth).mockResolvedValue(D(100));
    vi.mocked(guestPaymentsRepository.sumByMonth).mockResolvedValue(D(0));
    vi.mocked(otherRevenuesRepository.sumByMonth).mockResolvedValue(D(0));
    vi.mocked(expensesRepository.sumByMonth).mockResolvedValue(D(0));
    vi.mocked(monthlyClosingBalanceRepository.findByMonth).mockResolvedValue(null);
    vi.mocked(monthlyClosingBalanceRepository.findNextAfter).mockResolvedValue(null);

    await balanceService.recalculateFrom(new Date('2026-06-01'));

    const [, payload] = vi.mocked(monthlyClosingBalanceRepository.upsert).mock.calls[0];
    expect((payload.cumulativeBalance as Prisma.Decimal).toNumber()).toBe(-900);
  });

  it('propaga (cascateia) o novo saldo acumulado para meses futuros já fechados, sem tocar receita/despesa deles', async () => {
    // Editando um lançamento retroativo de agosto/2026: setembro e outubro já estavam fechados.
    const august = { referenceMonth: new Date('2026-08-01T00:00:00.000Z'), cumulativeBalance: D(15.99) };
    const september = {
      referenceMonth: new Date('2026-09-01T00:00:00.000Z'),
      revenueTotal: D(400),
      expenseTotal: D(200),
      monthBalance: D(200),
      cumulativeBalance: D(999), // valor antigo, desatualizado — deve ser recalculado
    };
    const october = {
      referenceMonth: new Date('2026-10-01T00:00:00.000Z'),
      revenueTotal: D(300),
      expenseTotal: D(300),
      monthBalance: D(0),
      cumulativeBalance: D(999),
    };

    vi.mocked(monthlyClosingBalanceRepository.findLatestBefore).mockResolvedValue(null);
    vi.mocked(socioPaymentsRepository.sumByMonth).mockResolvedValue(D(15.99));
    vi.mocked(guestPaymentsRepository.sumByMonth).mockResolvedValue(D(0));
    vi.mocked(otherRevenuesRepository.sumByMonth).mockResolvedValue(D(0));
    vi.mocked(expensesRepository.sumByMonth).mockResolvedValue(D(0));

    vi.mocked(monthlyClosingBalanceRepository.findByMonth).mockResolvedValueOnce(august);
    vi.mocked(monthlyClosingBalanceRepository.findNextAfter)
      .mockResolvedValueOnce(september)
      .mockResolvedValueOnce(october)
      .mockResolvedValueOnce(null);

    const augustUpdated = { ...august, ...september, cumulativeBalance: D(215.99) };
    const octoberUpdated = { ...october, cumulativeBalance: D(215.99) };
    vi.mocked(monthlyClosingBalanceRepository.upsert)
      .mockResolvedValueOnce(august as never) // recalcSingleMonth(august)
      .mockResolvedValueOnce(augustUpdated as never) // cascade: september recalculado
      .mockResolvedValueOnce(octoberUpdated as never); // cascade: october recalculado

    await balanceService.recalculateFrom(new Date('2026-08-01'));

    expect(monthlyClosingBalanceRepository.upsert).toHaveBeenCalledTimes(3);

    const septemberCall = vi.mocked(monthlyClosingBalanceRepository.upsert).mock.calls[1];
    expect(septemberCall[0]).toEqual(september.referenceMonth);
    expect((septemberCall[1].cumulativeBalance as Prisma.Decimal).toNumber()).toBeCloseTo(15.99 + 200, 2);

    const octoberCall = vi.mocked(monthlyClosingBalanceRepository.upsert).mock.calls[2];
    expect(octoberCall[0]).toEqual(october.referenceMonth);
    expect((octoberCall[1].cumulativeBalance as Prisma.Decimal).toNumber()).toBeCloseTo(215.99 + 0, 2);
  });
});
