import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../../src/repositories/socioPayments.repository', () => ({
  socioPaymentsRepository: {
    findBySocioAndMonth: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findBySocio: vi.fn(),
  },
}));
vi.mock('../../src/repositories/systemConfig.repository', () => ({
  systemConfigRepository: { get: vi.fn() },
}));
vi.mock('../../src/repositories/socios.repository', () => ({
  sociosRepository: { findById: vi.fn() },
}));
vi.mock('../../src/services/balance.service', () => ({
  balanceService: { recalculateFrom: vi.fn() },
}));
vi.mock('../../src/services/audit.service', () => ({
  auditService: { log: vi.fn() },
}));

import { socioPaymentsRepository } from '../../src/repositories/socioPayments.repository';
import { systemConfigRepository } from '../../src/repositories/systemConfig.repository';
import { sociosRepository } from '../../src/repositories/socios.repository';
import { balanceService } from '../../src/services/balance.service';
import { mensalidadesService } from '../../src/services/mensalidades.service';

describe('mensalidadesService.create (US4 — lançar pagamento de mensalidade)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sociosRepository.findById).mockResolvedValue({ id: 'socio-1', name: 'Ana' } as never);
    vi.mocked(socioPaymentsRepository.findBySocioAndMonth).mockResolvedValue(null);
    vi.mocked(systemConfigRepository.get).mockResolvedValue({ defaultMonthlyFee: 110 } as never);
    vi.mocked(socioPaymentsRepository.create).mockImplementation(async (data: never) => ({ id: 'pay-1', ...data }) as never);
  });

  it('Given seleciono sócio/mês e informo valor e forma, When salvo, Then o lançamento é criado com o valor informado', async () => {
    const payment = await mensalidadesService.create(
      { socioId: 'socio-1', referenceMonth: new Date('2026-08-10'), amount: 150, paymentMethod: 'PIX', paidAt: new Date('2026-08-10') },
      'user-diretor-1'
    );

    expect((payment as { amount: Prisma.Decimal }).amount.toNumber()).toBe(150);
  });

  it('Given NÃO informo valor customizado, When salvo, Then o sistema usa o valor padrão configurado (R$110,00)', async () => {
    const payment = await mensalidadesService.create(
      { socioId: 'socio-1', referenceMonth: new Date('2026-08-10'), paymentMethod: 'DIN', paidAt: new Date('2026-08-10') },
      'user-diretor-1'
    );

    expect((payment as { amount: Prisma.Decimal }).amount.toNumber()).toBe(110);
  });

  it('dispara recalculo do saldo acumulado (ADR-03) após criar o lançamento, para o mês de referência correto', async () => {
    await mensalidadesService.create(
      { socioId: 'socio-1', referenceMonth: new Date('2026-08-10'), paymentMethod: 'PIX', paidAt: new Date('2026-08-10') },
      'user-diretor-1'
    );

    // recalculateFrom normaliza para o dia 1 do mês (toReferenceMonth), como todo o domínio.
    expect(balanceService.recalculateFrom).toHaveBeenCalledWith(new Date('2026-08-01T00:00:00.000Z'));
  });

  it('rejeita lançamento duplicado — já existe pagamento para este sócio/mês (RNF8 — fonte única da verdade)', async () => {
    vi.mocked(socioPaymentsRepository.findBySocioAndMonth).mockResolvedValue({ id: 'pay-existente' } as never);

    await expect(
      mensalidadesService.create(
        { socioId: 'socio-1', referenceMonth: new Date('2026-08-10'), paymentMethod: 'PIX', paidAt: new Date('2026-08-10') },
        'user-diretor-1'
      )
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(socioPaymentsRepository.create).not.toHaveBeenCalled();
  });

  it('rejeita lançamento para sócio inexistente (404)', async () => {
    vi.mocked(sociosRepository.findById).mockResolvedValue(null);

    await expect(
      mensalidadesService.create(
        { socioId: 'socio-fantasma', referenceMonth: new Date('2026-08-10'), paymentMethod: 'PIX', paidAt: new Date('2026-08-10') },
        'user-diretor-1'
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
