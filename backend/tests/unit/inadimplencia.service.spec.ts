import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositories/socios.repository', () => ({
  sociosRepository: { findAllActiveIds: vi.fn() },
}));
vi.mock('../../src/repositories/socioPayments.repository', () => ({
  socioPaymentsRepository: { findByMonth: vi.fn() },
}));
vi.mock('../../src/services/socioStatus.service', () => ({
  socioStatusService: { getStatusForMonth: vi.fn() },
}));
vi.mock('../../src/repositories/systemConfig.repository', () => ({
  systemConfigRepository: { get: vi.fn() },
}));

import { sociosRepository } from '../../src/repositories/socios.repository';
import { socioPaymentsRepository } from '../../src/repositories/socioPayments.repository';
import { socioStatusService } from '../../src/services/socioStatus.service';
import { systemConfigRepository } from '../../src/repositories/systemConfig.repository';
import { inadimplenciaService } from '../../src/services/inadimplencia.service';

const socios = [
  { id: 's1', name: 'Ana', phone: '11911111111' },
  { id: 's2', name: 'Bruno', phone: null },
  { id: 's3', name: 'Carla (DM)', phone: '11933333333' },
  { id: 's4', name: 'Diego (Inativo)', phone: '11944444444' },
  { id: 's5', name: 'Elisa (pagou)', phone: '11955555555' },
];

function statusFor(id: string) {
  return { s1: 'A', s2: 'A', s3: 'DM', s4: 'I', s5: 'A' }[id];
}

describe('inadimplenciaService (RF12/RNF8 — inadimplência derivada, nunca campo booleano)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sociosRepository.findAllActiveIds).mockResolvedValue(socios as never);
    vi.mocked(socioStatusService.getStatusForMonth).mockImplementation(async (id: string) => statusFor(id) as never);
    // Só Elisa (s5) tem lançamento de pagamento no mês.
    vi.mocked(socioPaymentsRepository.findByMonth).mockResolvedValue([{ socioId: 's5' }] as never);
    vi.mocked(systemConfigRepository.get).mockResolvedValue({ defaultMonthlyFee: 110 } as never);
  });

  it('US14 — lista como inadimplentes só sócios status A sem lançamento no mês (ausência de lançamento, não campo booleano)', async () => {
    const inadimplentes = await inadimplenciaService.getInadimplentes(new Date('2026-08-01'));

    // Ana e Bruno: status A, sem pagamento -> inadimplentes.
    expect(inadimplentes.map((i) => i.id).sort()).toEqual(['s1', 's2']);
  });

  it('US5 — sócio em DM não aparece como inadimplente mesmo sem lançamento de pagamento', async () => {
    const inadimplentes = await inadimplenciaService.getInadimplentes(new Date('2026-08-01'));
    expect(inadimplentes.find((i) => i.id === 's3')).toBeUndefined();
  });

  it('sócio inativo (I) nunca é cobrado/listado como inadimplente', async () => {
    const inadimplentes = await inadimplenciaService.getInadimplentes(new Date('2026-08-01'));
    expect(inadimplentes.find((i) => i.id === 's4')).toBeUndefined();
  });

  it('sócio A com lançamento de pagamento no mês não aparece como inadimplente', async () => {
    const inadimplentes = await inadimplenciaService.getInadimplentes(new Date('2026-08-01'));
    expect(inadimplentes.find((i) => i.id === 's5')).toBeUndefined();
  });

  it('getResumo calcula percentual de inadimplência só sobre a base cobrável (status A), excluindo DM e I', async () => {
    const resumo = await inadimplenciaService.getResumo(new Date('2026-08-01'));

    // Cobráveis (status A): s1, s2, s5 = 3. Inadimplentes entre eles: s1, s2 = 2.
    expect(resumo.sociosCobraveis).toBe(3);
    expect(resumo.inadimplentesCount).toBe(2);
    expect(resumo.percentualInadimplencia).toBeCloseTo(2 / 3, 5);
    // Ativos = todos exceto I (s4): s1, s2, s3, s5 = 4.
    expect(resumo.sociosAtivos).toBe(4);
  });

  it('getResumo não divide por zero quando não há nenhum sócio cobrável (todos DM/I)', async () => {
    vi.mocked(socioStatusService.getStatusForMonth).mockImplementation(async () => 'DM' as never);
    vi.mocked(socioPaymentsRepository.findByMonth).mockResolvedValue([] as never);

    const resumo = await inadimplenciaService.getResumo(new Date('2026-08-01'));

    expect(resumo.sociosCobraveis).toBe(0);
    expect(resumo.percentualInadimplencia).toBe(0);
  });

  // code-review.md 🟡 #7 — fidelidade visual da tela "Gestão de Inadimplência" exige telefone
  // e valor devido por sócio. Isso é seguro aqui porque GET /inadimplencia é EXCLUSIVA do
  // DIRETOR (requireRole, ver authorization.spec.ts) — que já tem acesso a telefone/valor de
  // qualquer sócio por outras rotas (GET /socios/:id, /mensalidades). Não é uma rota agregada
  // nem acessível a sócios, então não reabre RSP3 (dado financeiro pessoal continua restrito
  // ao próprio sócio + diretor).
  it('getInadimplentes inclui telefone, valor devido (padrão configurado) e dias em aberto — dado seguro por ser rota exclusiva do diretor', async () => {
    const inadimplentes = await inadimplenciaService.getInadimplentes(new Date('2026-08-01'));

    const ana = inadimplentes.find((i) => i.id === 's1');
    expect(ana).toMatchObject({ id: 's1', name: 'Ana', phone: '11911111111', amount: 110 });
    expect(typeof ana?.diasEmAberto).toBe('number');

    const bruno = inadimplentes.find((i) => i.id === 's2');
    expect(bruno?.phone).toBeNull(); // sócio sem telefone cadastrado — nunca quebra, vira null
  });
});
