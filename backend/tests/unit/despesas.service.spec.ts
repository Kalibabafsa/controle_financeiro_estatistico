import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositories/expenses.repository', () => ({
  expensesRepository: { create: vi.fn(), findById: vi.fn(), findByMonth: vi.fn(), sumByMonth: vi.fn() },
}));
vi.mock('../../src/repositories/expenseCategories.repository', () => ({
  expenseCategoriesRepository: { findById: vi.fn() },
}));
vi.mock('../../src/lib/supabaseStorage', () => ({
  supabaseStorage: { upload: vi.fn(), getSignedUrl: vi.fn() },
}));
vi.mock('../../src/services/balance.service', () => ({
  balanceService: { recalculateFrom: vi.fn() },
}));
vi.mock('../../src/services/audit.service', () => ({
  auditService: { log: vi.fn() },
}));

import { expensesRepository } from '../../src/repositories/expenses.repository';
import { expenseCategoriesRepository } from '../../src/repositories/expenseCategories.repository';
import { supabaseStorage } from '../../src/lib/supabaseStorage';
import { despesasService } from '../../src/services/despesas.service';

describe('despesasService.create (US6 — lançar despesa semanal com comprovante)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(expenseCategoriesRepository.findById).mockResolvedValue({ id: 'cat-1', name: 'Arbitragem' } as never);
    vi.mocked(expensesRepository.create).mockImplementation(async (data: never) => ({ id: 'exp-1', ...data }) as never);
  });

  const baseInput = {
    categoryId: 'cat-1',
    weekStart: new Date('2026-03-01'),
    weekEnd: new Date('2026-03-07'),
    amount: 150,
  };

  it('Given informo semana, categoria, valor e anexo um arquivo, When salvo, Then a despesa é salva com o anexo disponível', async () => {
    vi.mocked(supabaseStorage.upload).mockResolvedValue('uuid-comprovante.png');

    const expense = await despesasService.create(baseInput, 'diretor-1', {
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/png',
      originalname: 'comprovante.png',
    });

    expect(supabaseStorage.upload).toHaveBeenCalled();
    expect((expense as { attachmentPath?: string }).attachmentPath).toBe('uuid-comprovante.png');
  });

  it('permite lançar despesa sem anexo (anexo é opcional, RF16 "deve poder anexar", não obrigatório)', async () => {
    const expense = await despesasService.create(baseInput, 'diretor-1');

    expect(supabaseStorage.upload).not.toHaveBeenCalled();
    expect((expense as { attachmentPath?: string }).attachmentPath).toBeUndefined();
  });

  it('rejeita lançamento para categoria de despesa inexistente/inativa (404)', async () => {
    vi.mocked(expenseCategoriesRepository.findById).mockResolvedValue(null);

    await expect(despesasService.create(baseInput, 'diretor-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(expensesRepository.create).not.toHaveBeenCalled();
  });

  it('dispara recalculo do saldo (ADR-03) para o mês da semana de início da despesa', async () => {
    const { balanceService } = await import('../../src/services/balance.service');
    await despesasService.create(baseInput, 'diretor-1');

    expect(balanceService.recalculateFrom).toHaveBeenCalledWith(new Date('2026-03-01'));
  });
});
