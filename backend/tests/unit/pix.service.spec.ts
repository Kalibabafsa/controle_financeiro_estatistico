import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositories/systemConfig.repository', () => ({
  systemConfigRepository: { get: vi.fn() },
}));
vi.mock('../../src/lib/pix/InterPixGateway', () => ({
  InterPixGateway: vi.fn().mockImplementation(() => ({
    generatePayload: vi.fn().mockResolvedValue({ emvPayload: 'INTER-PAYLOAD', pixKey: 'inter-key' }),
  })),
}));

import { systemConfigRepository } from '../../src/repositories/systemConfig.repository';
import { pixService } from '../../src/services/pix.service';
import { env } from '../../src/lib/env';

describe('pixService.getPayload (ADR-05 — gateway Pix abstrato, manual como implementação ativa do MVP)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('US3 — gera o payload EMV manual (estático) a partir da config quando PIX_INTEGRATION_MODE=manual (default do MVP)', async () => {
    vi.mocked(systemConfigRepository.get).mockResolvedValue({
      pixKey: 'associacao@pix.com',
      pixBeneficiaryName: 'Associacao Kalibaba',
      pixCity: 'Sao Paulo',
      interIntegrationEnabled: false,
      defaultMonthlyFee: 110,
    } as never);

    const result = await pixService.getPayload(110);

    expect(result.pixKey).toBe('associacao@pix.com');
    expect(result.emvPayload).toContain('br.gov.bcb.pix');
    expect(result.emvPayload).not.toBe('INTER-PAYLOAD');
  });

  it('usa o valor padrão configurado (R$110,00) quando nenhum valor é informado (US4)', async () => {
    vi.mocked(systemConfigRepository.get).mockResolvedValue({
      pixKey: 'associacao@pix.com',
      pixBeneficiaryName: 'Associacao Kalibaba',
      pixCity: 'Sao Paulo',
      interIntegrationEnabled: false,
      defaultMonthlyFee: 110,
    } as never);

    const result = await pixService.getPayload(undefined);

    expect(result.emvPayload).toContain('5406110.00');
  });

  it('lança erro de domínio (409 PIX_NOT_CONFIGURED) quando os dados do Pix da associação ainda não foram cadastrados', async () => {
    vi.mocked(systemConfigRepository.get).mockResolvedValue({
      pixKey: null,
      pixBeneficiaryName: null,
      pixCity: null,
      interIntegrationEnabled: false,
      defaultMonthlyFee: 110,
    } as never);

    await expect(pixService.getPayload(110)).rejects.toMatchObject({ statusCode: 409 });
  });

  // BUG encontrado pelo QA (ver docs/planning/qa-report.md) — mesma causa raiz do teste
  // "[BUG conhecido]" em emv.spec.ts: a descrição é truncada em 25 chars e perde o ano completo.
  it('[BUG conhecido] inclui a descrição "Mensalidade Kalibaba mês/ano" completa no payload quando referenceMonth é informado', async () => {
    vi.mocked(systemConfigRepository.get).mockResolvedValue({
      pixKey: 'associacao@pix.com',
      pixBeneficiaryName: 'Associacao Kalibaba',
      pixCity: 'Sao Paulo',
      interIntegrationEnabled: false,
      defaultMonthlyFee: 110,
    } as never);

    const result = await pixService.getPayload(110, new Date(Date.UTC(2026, 7, 1)));

    expect(result.emvPayload).toContain('MENSALIDADE KALIBABA 8/2026');
  });

  it('não usa o gateway Inter mesmo com interIntegrationEnabled=true se PIX_INTEGRATION_MODE não for "inter" (env manda, RF23 é fase 2)', async () => {
    expect(env.PIX_INTEGRATION_MODE).toBe('manual');
    vi.mocked(systemConfigRepository.get).mockResolvedValue({
      pixKey: 'associacao@pix.com',
      pixBeneficiaryName: 'Associacao Kalibaba',
      pixCity: 'Sao Paulo',
      interIntegrationEnabled: true,
      defaultMonthlyFee: 110,
    } as never);

    const result = await pixService.getPayload(110);

    expect(result.emvPayload).not.toBe('INTER-PAYLOAD');
  });
});
