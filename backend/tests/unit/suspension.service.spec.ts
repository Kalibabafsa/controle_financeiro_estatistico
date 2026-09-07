import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositories/babas.repository', () => ({
  babasRepository: { findPreviousBefore: vi.fn() },
}));
vi.mock('../../src/repositories/suspensions.repository', () => ({
  suspensionsRepository: { findActiveForParticipant: vi.fn() },
}));

import { babasRepository } from '../../src/repositories/babas.repository';
import { suspensionsRepository } from '../../src/repositories/suspensions.repository';
import { suspensionService } from '../../src/services/suspension.service';

describe('suspensionService.isSuspended (ADR-04 — suspensão computável a qualquer momento)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('US11 — jogador com cartão vermelho no baba anterior está suspenso no baba seguinte', async () => {
    const previousBaba = { id: 'baba-2026-08-17', date: new Date('2026-08-17') };
    vi.mocked(babasRepository.findPreviousBefore).mockResolvedValue(previousBaba as never);
    vi.mocked(suspensionsRepository.findActiveForParticipant).mockResolvedValue({ id: 'susp-1' } as never);

    const suspenso = await suspensionService.isSuspended({ socioId: 'socio-1' }, new Date('2026-08-24'));

    expect(suspenso).toBe(true);
    expect(babasRepository.findPreviousBefore).toHaveBeenCalledWith(new Date('2026-08-24'));
    expect(suspensionsRepository.findActiveForParticipant).toHaveBeenCalledWith(previousBaba.id, 'socio-1', undefined);
  });

  it('US12 — jogador com cartão azul (sem suspensão registrada) não fica suspenso', async () => {
    const previousBaba = { id: 'baba-2026-08-17', date: new Date('2026-08-17') };
    vi.mocked(babasRepository.findPreviousBefore).mockResolvedValue(previousBaba as never);
    vi.mocked(suspensionsRepository.findActiveForParticipant).mockResolvedValue(null);

    const suspenso = await suspensionService.isSuspended({ socioId: 'socio-2' }, new Date('2026-08-24'));

    expect(suspenso).toBe(false);
  });

  it('não há baba anterior (primeiro baba da temporada) — nunca há suspensão', async () => {
    vi.mocked(babasRepository.findPreviousBefore).mockResolvedValue(null);

    const suspenso = await suspensionService.isSuspended({ socioId: 'socio-1' }, new Date('2026-01-04'));

    expect(suspenso).toBe(false);
    expect(suspensionsRepository.findActiveForParticipant).not.toHaveBeenCalled();
  });

  it('funciona também para convidados (suspensão não é exclusiva de sócio)', async () => {
    const previousBaba = { id: 'baba-anterior', date: new Date('2026-08-17') };
    vi.mocked(babasRepository.findPreviousBefore).mockResolvedValue(previousBaba as never);
    vi.mocked(suspensionsRepository.findActiveForParticipant).mockResolvedValue({ id: 'susp-2' } as never);

    const suspenso = await suspensionService.isSuspended({ convidadoId: 'convidado-1' }, new Date('2026-08-24'));

    expect(suspenso).toBe(true);
    expect(suspensionsRepository.findActiveForParticipant).toHaveBeenCalledWith(previousBaba.id, undefined, 'convidado-1');
  });

  it('suspensão liberada (override manual do diretor) não é mais considerada ativa', async () => {
    // findActiveForParticipant já deveria filtrar liftedAt IS NULL na query — aqui simulamos
    // o repositório respeitando esse contrato e retornando null após a liberação.
    const previousBaba = { id: 'baba-anterior', date: new Date('2026-08-17') };
    vi.mocked(babasRepository.findPreviousBefore).mockResolvedValue(previousBaba as never);
    vi.mocked(suspensionsRepository.findActiveForParticipant).mockResolvedValue(null);

    const suspenso = await suspensionService.isSuspended({ socioId: 'socio-1' }, new Date('2026-08-24'));

    expect(suspenso).toBe(false);
  });
});
