import { socioStatusRepository } from '../repositories/socios.repository';
import { toReferenceMonth } from '../lib/date';
import type { MemberStatus } from '@prisma/client';

// ADR-02 — status mensal com carry-forward, sem job agendado.
export const socioStatusService = {
  async getStatusForMonth(socioId: string, month: Date): Promise<MemberStatus> {
    const referenceMonth = toReferenceMonth(month);

    const exact = await socioStatusRepository.findExactMonth(socioId, referenceMonth);
    if (exact) return exact.status;

    const mostRecent = await socioStatusRepository.findMostRecentUpTo(socioId, referenceMonth);
    if (mostRecent) return mostRecent.status;

    return 'A'; // sócio novo, sem histórico — assume Ativo
  },
};
