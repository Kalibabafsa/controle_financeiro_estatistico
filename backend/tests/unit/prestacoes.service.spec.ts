import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../../src/repositories/prestacoes.repository', () => ({
  prestacoesRepository: { findAll: vi.fn(), findByMonth: vi.fn(), create: vi.fn() },
}));
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
  expensesRepository: { findByMonth: vi.fn() },
}));
vi.mock('../../src/repositories/monthlyClosingBalance.repository', () => ({
  monthlyClosingBalanceRepository: { findByMonth: vi.fn() },
}));
vi.mock('../../src/lib/supabaseStorage', () => ({
  supabaseStorage: { upload: vi.fn(), getSignedUrl: vi.fn() },
}));
vi.mock('../../src/lib/pdf/generatePdf', () => ({
  generatePdfFromHtml: vi.fn().mockResolvedValue(Buffer.from('pdf')),
}));
vi.mock('../../src/services/audit.service', () => ({
  auditService: { log: vi.fn() },
}));

import { prestacoesRepository } from '../../src/repositories/prestacoes.repository';
import { socioPaymentsRepository } from '../../src/repositories/socioPayments.repository';
import { guestPaymentsRepository } from '../../src/repositories/guestPayments.repository';
import { otherRevenuesRepository } from '../../src/repositories/revenueCategories.repository';
import { expensesRepository } from '../../src/repositories/expenses.repository';
import { monthlyClosingBalanceRepository } from '../../src/repositories/monthlyClosingBalance.repository';
import { supabaseStorage } from '../../src/lib/supabaseStorage';
import { prestacoesService } from '../../src/services/prestacoes.service';

const D = (n: number) => new Prisma.Decimal(n);

describe('prestacoesService (US7/US8 — saldo do mês e geração de Prestação de Contas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(socioPaymentsRepository.sumByMonth).mockResolvedValue(D(1000));
    vi.mocked(guestPaymentsRepository.sumByMonth).mockResolvedValue(D(150));
    vi.mocked(otherRevenuesRepository.sumByMonth).mockResolvedValue(D(50));
    vi.mocked(expensesRepository.findByMonth).mockResolvedValue([
      { amount: D(200), category: { name: 'Arbitragem' } },
      { amount: D(100), category: { name: 'Arbitragem' } },
      { amount: D(300), category: { name: 'Bolas' } },
    ] as never);
    vi.mocked(monthlyClosingBalanceRepository.findByMonth).mockResolvedValue({
      monthBalance: D(600),
      cumulativeBalance: D(-184.01),
    } as never);
  });

  it('US7 — snapshot usa o saldo acumulado já materializado (ADR-03), não recalcula do zero', async () => {
    const snapshot = await prestacoesService.preview(new Date('2026-08-05'));

    expect(snapshot.cumulativeBalance).toBe(-184.01);
    expect(snapshot.monthBalance).toBe(600);
  });

  it('US8 — agrupa despesas por categoria somando os valores (não lista lançamento a lançamento)', async () => {
    const snapshot = await prestacoesService.preview(new Date('2026-08-05'));

    expect(snapshot.expensesByCategory).toEqual(
      expect.arrayContaining([
        { category: 'Arbitragem', total: 300 },
        { category: 'Bolas', total: 300 },
      ])
    );
    expect(snapshot.expenseTotal).toBe(600);
  });

  it('receita total soma as 3 fontes (sócios + convidados + outras receitas)', async () => {
    const snapshot = await prestacoesService.preview(new Date('2026-08-05'));
    expect(snapshot.revenueTotal).toBe(1200);
  });

  it('US8 — Given mês com lançamentos completos, When gero o PDF, Then salva o relatório e não permite gerar duas vezes o mesmo mês', async () => {
    vi.mocked(prestacoesRepository.findByMonth).mockResolvedValue(null);
    vi.mocked(prestacoesRepository.create).mockResolvedValue({ id: 'report-1' } as never);
    vi.mocked(supabaseStorage.upload).mockResolvedValue('prestacao-2026-08.pdf');

    const report = await prestacoesService.generate(new Date('2026-08-05'), 'diretor-1');

    expect(report).toEqual({ id: 'report-1' });
    expect(supabaseStorage.upload).toHaveBeenCalledWith(
      expect.any(String),
      'prestacao-2026-08.pdf',
      expect.any(Buffer),
      'application/pdf'
    );
  });

  it('rejeita gerar a prestação de contas duas vezes para o mesmo mês (409)', async () => {
    vi.mocked(prestacoesRepository.findByMonth).mockResolvedValue({ id: 'ja-existe' } as never);

    await expect(prestacoesService.generate(new Date('2026-08-05'), 'diretor-1')).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(prestacoesRepository.create).not.toHaveBeenCalled();
  });
});
