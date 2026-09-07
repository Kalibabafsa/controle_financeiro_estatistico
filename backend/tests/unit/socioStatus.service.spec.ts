import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/repositories/socios.repository', () => ({
  socioStatusRepository: {
    findExactMonth: vi.fn(),
    findMostRecentUpTo: vi.fn(),
  },
}));

import { socioStatusRepository } from '../../src/repositories/socios.repository';
import { socioStatusService } from '../../src/services/socioStatus.service';

const findExactMonth = vi.mocked(socioStatusRepository.findExactMonth);
const findMostRecentUpTo = vi.mocked(socioStatusRepository.findMostRecentUpTo);

describe('socioStatusService.getStatusForMonth (ADR-02 — carry-forward mensal)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna o status exato do mês quando existe um registro para aquele mês', async () => {
    findExactMonth.mockResolvedValue({ status: 'DM' } as never);

    const status = await socioStatusService.getStatusForMonth('socio-1', new Date('2026-08-15'));

    expect(status).toBe('DM');
    expect(findMostRecentUpTo).not.toHaveBeenCalled();
  });

  it('faz carry-forward do status mais recente anterior quando o mês exato não tem registro', async () => {
    findExactMonth.mockResolvedValue(null);
    findMostRecentUpTo.mockResolvedValue({ status: 'I' } as never);

    // Sócio ficou I em maio; junho e julho não têm lançamento de status — deve herdar I.
    const status = await socioStatusService.getStatusForMonth('socio-1', new Date('2026-07-01'));

    expect(status).toBe('I');
    expect(findMostRecentUpTo).toHaveBeenCalledWith('socio-1', expect.any(Date));
  });

  it('assume "A" (ativo) para sócio novo sem nenhum histórico de status', async () => {
    findExactMonth.mockResolvedValue(null);
    findMostRecentUpTo.mockResolvedValue(null);

    const status = await socioStatusService.getStatusForMonth('socio-novo', new Date('2026-01-01'));

    expect(status).toBe('A');
  });

  it('carry-forward nunca olha para status futuro (só <= mês de referência)', async () => {
    findExactMonth.mockResolvedValue(null);
    findMostRecentUpTo.mockResolvedValue(null);

    await socioStatusService.getStatusForMonth('socio-1', new Date('2026-03-10'));

    const [, referenceMonthArg] = findMostRecentUpTo.mock.calls[0];
    expect((referenceMonthArg as Date).toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });
});
