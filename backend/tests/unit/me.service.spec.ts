import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositories/socioPayments.repository', () => ({
  socioPaymentsRepository: { findBySocioAndMonth: vi.fn() },
}));
vi.mock('../../src/services/socioStatus.service', () => ({
  socioStatusService: { getStatusForMonth: vi.fn() },
}));
vi.mock('../../src/repositories/babas.repository', () => ({
  babasRepository: { findNextFrom: vi.fn() },
}));
vi.mock('../../src/services/suspension.service', () => ({
  suspensionService: { isSuspended: vi.fn() },
}));

import { socioPaymentsRepository } from '../../src/repositories/socioPayments.repository';
import { socioStatusService } from '../../src/services/socioStatus.service';
import { babasRepository } from '../../src/repositories/babas.repository';
import { suspensionService } from '../../src/services/suspension.service';
import { meService } from '../../src/services/me.service';

describe('meService.getSituacao (US2 — sócio consulta a própria situação financeira)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Given não há lançamento de pagamento para o mês corrente, When consulto minha situação, Then emDia=false (inadimplente)', async () => {
    vi.mocked(socioStatusService.getStatusForMonth).mockResolvedValue('A' as never);
    vi.mocked(socioPaymentsRepository.findBySocioAndMonth).mockResolvedValue(null);

    const situacao = await meService.getSituacao('socio-1');

    expect(situacao.emDia).toBe(false);
    expect(situacao.payment).toBeNull();
  });

  it('Given há lançamento de pagamento para o mês corrente, When consulto minha situação, Then emDia=true', async () => {
    vi.mocked(socioStatusService.getStatusForMonth).mockResolvedValue('A' as never);
    vi.mocked(socioPaymentsRepository.findBySocioAndMonth).mockResolvedValue({ id: 'pay-1', paidAt: new Date() } as never);

    const situacao = await meService.getSituacao('socio-1');

    expect(situacao.emDia).toBe(true);
    expect(situacao.payment).toEqual({ id: 'pay-1', paidAt: expect.any(Date) });
  });

  it('US5 — sócio em DM sem lançamento continua "em dia" (não é cobrado por padrão)', async () => {
    vi.mocked(socioStatusService.getStatusForMonth).mockResolvedValue('DM' as never);
    vi.mocked(socioPaymentsRepository.findBySocioAndMonth).mockResolvedValue(null);

    const situacao = await meService.getSituacao('socio-1');

    expect(situacao.emDia).toBe(true);
  });

  it('sócio inativo (I) sem lançamento também não é tratado como inadimplente', async () => {
    vi.mocked(socioStatusService.getStatusForMonth).mockResolvedValue('I' as never);
    vi.mocked(socioPaymentsRepository.findBySocioAndMonth).mockResolvedValue(null);

    const situacao = await meService.getSituacao('socio-1');

    expect(situacao.emDia).toBe(true);
  });
});

describe('meService.getProximoBaba (US11, lado do sócio — vê se está apto ou suspenso)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sem próximo baba agendado, considera o sócio apto (não há o que bloquear)', async () => {
    vi.mocked(babasRepository.findNextFrom).mockResolvedValue(null);

    const result = await meService.getProximoBaba('socio-1');

    expect(result).toEqual({ proximoBaba: null, apto: true });
    expect(suspensionService.isSuspended).not.toHaveBeenCalled();
  });

  it('Given cartão vermelho no baba anterior, When consulto o próximo baba, Then apto=false (suspenso)', async () => {
    const proximoBaba = { id: 'baba-2', date: new Date('2026-08-31') };
    vi.mocked(babasRepository.findNextFrom).mockResolvedValue(proximoBaba as never);
    vi.mocked(suspensionService.isSuspended).mockResolvedValue(true);

    const result = await meService.getProximoBaba('socio-1');

    expect(result.apto).toBe(false);
    expect(suspensionService.isSuspended).toHaveBeenCalledWith({ socioId: 'socio-1' }, proximoBaba.date);
  });

  it('sem suspensão ativa, apto=true', async () => {
    const proximoBaba = { id: 'baba-2', date: new Date('2026-08-31') };
    vi.mocked(babasRepository.findNextFrom).mockResolvedValue(proximoBaba as never);
    vi.mocked(suspensionService.isSuspended).mockResolvedValue(false);

    const result = await meService.getProximoBaba('socio-1');

    expect(result.apto).toBe(true);
  });
});
