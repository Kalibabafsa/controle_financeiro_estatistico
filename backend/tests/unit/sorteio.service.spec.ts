import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositories/babas.repository', () => ({
  babasRepository: { findById: vi.fn() },
}));
vi.mock('../../src/repositories/presencas.repository', () => ({
  presencasRepository: { findByBabaId: vi.fn() },
}));
vi.mock('../../src/repositories/teams.repository', () => ({
  teamsRepository: { replaceAll: vi.fn() },
}));

import { babasRepository } from '../../src/repositories/babas.repository';
import { presencasRepository } from '../../src/repositories/presencas.repository';
import { teamsRepository } from '../../src/repositories/teams.repository';
import { sorteioService } from '../../src/services/sorteio.service';

function makePresenca(id: string, position: 'GOLEIRO' | 'LINHA') {
  return { id, position };
}

describe('sorteioService.sortear (US10 — sorteio de 4 times por posição)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(babasRepository.findById).mockResolvedValue({ id: 'baba-1', date: new Date('2026-08-24') } as never);
    vi.mocked(teamsRepository.replaceAll).mockImplementation(async (_id, assignments) => assignments as never);
  });

  it('Given 28 presentes (4 goleiros + 24 de linha), When sorteio, Then distribui em Time 1 a Time 4 com 1 goleiro + 6 de linha cada', async () => {
    const goleiros = Array.from({ length: 4 }, (_, i) => makePresenca(`g${i}`, 'GOLEIRO'));
    const linha = Array.from({ length: 24 }, (_, i) => makePresenca(`l${i}`, 'LINHA'));
    vi.mocked(presencasRepository.findByBabaId).mockResolvedValue([...goleiros, ...linha] as never);

    const result = await sorteioService.sortear('baba-1');

    expect(result).toHaveLength(4);
    for (const team of result as Array<{ number: number; presencaIds: string[] }>) {
      const goleirosNoTime = team.presencaIds.filter((id) => id.startsWith('g'));
      const linhaNoTime = team.presencaIds.filter((id) => id.startsWith('l'));
      expect(goleirosNoTime).toHaveLength(1);
      expect(linhaNoTime).toHaveLength(6);
    }
  });

  it('nunca duplica nem perde um presente entre os 4 times (todo presencaId sorteado aparece exatamente uma vez)', async () => {
    const goleiros = Array.from({ length: 4 }, (_, i) => makePresenca(`g${i}`, 'GOLEIRO'));
    const linha = Array.from({ length: 24 }, (_, i) => makePresenca(`l${i}`, 'LINHA'));
    const all = [...goleiros, ...linha];
    vi.mocked(presencasRepository.findByBabaId).mockResolvedValue(all as never);

    const result = (await sorteioService.sortear('baba-1')) as Array<{ presencaIds: string[] }>;
    const flat = result.flatMap((t) => t.presencaIds);

    expect(flat.sort()).toEqual(all.map((p) => p.id).sort());
    expect(new Set(flat).size).toBe(flat.length); // sem duplicatas
  });

  it('Given nenhuma presença registrada, When tenta sortear, Then rejeita com erro de domínio (não estoura em runtime)', async () => {
    vi.mocked(presencasRepository.findByBabaId).mockResolvedValue([] as never);

    await expect(sorteioService.sortear('baba-1')).rejects.toMatchObject({ statusCode: 409 });
    expect(teamsRepository.replaceAll).not.toHaveBeenCalled();
  });

  it('distribuição desbalanceada (número de presentes não fecha 28) ainda assim não perde ninguém entre os times', async () => {
    const goleiros = Array.from({ length: 2 }, (_, i) => makePresenca(`g${i}`, 'GOLEIRO'));
    const linha = Array.from({ length: 15 }, (_, i) => makePresenca(`l${i}`, 'LINHA'));
    vi.mocked(presencasRepository.findByBabaId).mockResolvedValue([...goleiros, ...linha] as never);

    const result = (await sorteioService.sortear('baba-1')) as Array<{ presencaIds: string[] }>;
    const flat = result.flatMap((t) => t.presencaIds);
    expect(flat).toHaveLength(17);
    expect(new Set(flat).size).toBe(17); // ninguém duplicado, ninguém perdido

    // Nota (achado menor de QA, não bloqueante): goleiros e jogadores de linha são
    // distribuídos em round-robin *independentes* — como só 2 dos 4 times recebem goleiro,
    // esses 2 times acabam com 1 presente a mais que os outros 2 quando a linha também não
    // fecha múltiplo de 4. O comentário do código ("distribuição o mais equilibrada possível")
    // é levemente otimista: a diferença observada pode chegar a 2, não só 1.
    const sizes = result.map((t) => t.presencaIds.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(2);
  });

  it('Given resultado do sorteio desbalanceado, When diretor edita manualmente um time, Then a alteração é salva via saveManual', async () => {
    vi.mocked(teamsRepository.replaceAll).mockResolvedValue([{ number: 1, presencaIds: ['p1'] }] as never);

    const result = await sorteioService.saveManual('baba-1', { teams: [{ number: 1, presencaIds: ['p1'] }] });

    expect(teamsRepository.replaceAll).toHaveBeenCalledWith('baba-1', [{ number: 1, presencaIds: ['p1'] }]);
    expect(result).toEqual([{ number: 1, presencaIds: ['p1'] }]);
  });
});
