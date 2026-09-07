import { beforeEach, describe, expect, it, vi } from 'vitest';

// code-review.md 🟡 #3 — rankingsService não deve mais importar Prisma diretamente; a busca de
// presenças/contagem de babas por temporada agora vive atrás de presencasRepository/babasRepository,
// como o resto do backend. Os testes passam a mockar os repositories, não `lib/prisma`.
vi.mock('../../src/repositories/gameEvents.repository', () => ({
  gameEventsRepository: { findBySeasonAndType: vi.fn() },
}));
vi.mock('../../src/repositories/presencas.repository', () => ({
  presencasRepository: { findBySeasonForSocios: vi.fn() },
}));
vi.mock('../../src/repositories/babas.repository', () => ({
  babasRepository: { countBySeason: vi.fn() },
}));

import { gameEventsRepository } from '../../src/repositories/gameEvents.repository';
import { presencasRepository } from '../../src/repositories/presencas.repository';
import { babasRepository } from '../../src/repositories/babas.repository';
import { rankingsService } from '../../src/services/rankings.service';

describe('rankingsService.get (US13 — rankings por temporada / RF32-RF35)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('US13 — artilheiros: ordena por gols marcados na temporada, do maior para o menor', async () => {
    vi.mocked(gameEventsRepository.findBySeasonAndType).mockResolvedValue([
      { presenca: { socio: { id: 's1', name: 'Ana' } } },
      { presenca: { socio: { id: 's2', name: 'Bruno' } } },
      { presenca: { socio: { id: 's1', name: 'Ana' } } },
      { presenca: { socio: { id: 's1', name: 'Ana' } } },
    ] as never);

    const result = await rankingsService.get({ season: 2026, type: 'artilheiros' });

    expect(result).toEqual([
      { socioId: 's1', name: 'Ana', value: 3 },
      { socioId: 's2', name: 'Bruno', value: 1 },
    ]);
    expect(gameEventsRepository.findBySeasonAndType).toHaveBeenCalledWith(2026, { equals: 'GOL' });
  });

  it('RF9 — convidados nunca entram no ranking de artilheiros (evento sem sócio associado é ignorado)', async () => {
    vi.mocked(gameEventsRepository.findBySeasonAndType).mockResolvedValue([
      { presenca: { socio: null } }, // gol de convidado
      { presenca: { socio: { id: 's1', name: 'Ana' } } },
    ] as never);

    const result = await rankingsService.get({ season: 2026, type: 'artilheiros' });

    expect(result).toEqual([{ socioId: 's1', name: 'Ana', value: 1 }]);
  });

  it('RF33 — ranking de cartões conta amarelo/azul/vermelho separadamente por sócio', async () => {
    vi.mocked(gameEventsRepository.findBySeasonAndType).mockResolvedValue([
      { type: 'CARTAO_AMARELO', presenca: { socio: { id: 's1', name: 'Ana' } } },
      { type: 'CARTAO_VERMELHO', presenca: { socio: { id: 's1', name: 'Ana' } } },
      { type: 'CARTAO_AZUL', presenca: { socio: { id: 's2', name: 'Bruno' } } },
    ] as never);

    const result = await rankingsService.get({ season: 2026, type: 'cartoes' });

    expect(result).toEqual([
      { socioId: 's1', name: 'Ana', amarelo: 1, azul: 0, vermelho: 1 },
      { socioId: 's2', name: 'Bruno', amarelo: 0, azul: 1, vermelho: 0 },
    ]);
  });

  it('RF34 — ranking de presença calcula percentual sobre o total de babas da temporada e só considera sócios (RF9)', async () => {
    vi.mocked(presencasRepository.findBySeasonForSocios).mockResolvedValue([
      { socio: { id: 's1', name: 'Ana' } },
      { socio: { id: 's1', name: 'Ana' } },
      { socio: null }, // presença de convidado
    ] as never);
    vi.mocked(babasRepository.countBySeason).mockResolvedValue(4 as never);

    const result = await rankingsService.get({ season: 2026, type: 'presenca' });

    expect(result).toEqual([{ socioId: 's1', name: 'Ana', value: 2, totalBabas: 4, percentual: 0.5 }]);
    expect(presencasRepository.findBySeasonForSocios).toHaveBeenCalledWith(2026);
    expect(babasRepository.countBySeason).toHaveBeenCalledWith(2026);
  });

  it('RF35 — filtra eventos/presenças pelo ano civil (temporada), não pelo histórico completo', async () => {
    vi.mocked(gameEventsRepository.findBySeasonAndType).mockResolvedValue([] as never);

    await rankingsService.get({ season: 2025, type: 'artilheiros' });

    expect(gameEventsRepository.findBySeasonAndType).toHaveBeenCalledWith(2025, { equals: 'GOL' });
  });
});
