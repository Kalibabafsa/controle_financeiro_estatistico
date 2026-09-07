import { babasRepository } from '../repositories/babas.repository';
import { presencasRepository } from '../repositories/presencas.repository';
import { gameEventsRepository } from '../repositories/gameEvents.repository';
import type { RankingsQuery } from '../schemas/babas.schemas';
import type { EventType } from '@prisma/client';

interface ArtilheiroRow {
  socioId: string;
  name: string;
  value: number;
}

interface CartaoRow {
  socioId: string;
  name: string;
  amarelo: number;
  azul: number;
  vermelho: number;
}

interface PresencaRow {
  socioId: string;
  name: string;
  value: number;
  totalBabas: number;
  percentual: number;
}

function aggregateGols(events: Array<{ presenca: { socio: { id: string; name: string } | null } }>): ArtilheiroRow[] {
  const counts = new Map<string, ArtilheiroRow>();
  for (const event of events) {
    const socio = event.presenca.socio;
    if (!socio) continue;
    const current = counts.get(socio.id) ?? { socioId: socio.id, name: socio.name, value: 0 };
    current.value += 1;
    counts.set(socio.id, current);
  }
  return Array.from(counts.values()).sort((a, b) => b.value - a.value);
}

function aggregateCartoes(
  events: Array<{ type: EventType; presenca: { socio: { id: string; name: string } | null } }>
): CartaoRow[] {
  const counts = new Map<string, CartaoRow>();
  for (const event of events) {
    const socio = event.presenca.socio;
    if (!socio) continue;
    const current = counts.get(socio.id) ?? { socioId: socio.id, name: socio.name, amarelo: 0, azul: 0, vermelho: 0 };
    if (event.type === 'CARTAO_AMARELO') current.amarelo += 1;
    if (event.type === 'CARTAO_AZUL') current.azul += 1;
    if (event.type === 'CARTAO_VERMELHO') current.vermelho += 1;
    counts.set(socio.id, current);
  }
  return Array.from(counts.values()).sort(
    (a, b) => b.amarelo + b.azul + b.vermelho - (a.amarelo + a.azul + a.vermelho)
  );
}

export const rankingsService = {
  async get(query: RankingsQuery): Promise<ArtilheiroRow[] | CartaoRow[] | PresencaRow[]> {
    if (query.type === 'artilheiros') {
      const events = await gameEventsRepository.findBySeasonAndType(query.season, { equals: 'GOL' });
      return aggregateGols(events);
    }

    if (query.type === 'cartoes') {
      const events = await gameEventsRepository.findBySeasonAndType(query.season, {
        in: ['CARTAO_AMARELO', 'CARTAO_AZUL', 'CARTAO_VERMELHO'],
      });
      return aggregateCartoes(events);
    }

    // presenca — RF34: contagem de presenças (não eventos) por sócio na temporada,
    // com percentual sobre o total de babas já registrados na temporada.
    // code-review.md 🟡 #3 — antes chamava prisma.presenca/babaDoDia diretamente; agora
    // sempre atrás de repository, como o resto do backend (camadas: service nunca importa Prisma).
    const [presencas, totalBabas] = await Promise.all([
      presencasRepository.findBySeasonForSocios(query.season),
      babasRepository.countBySeason(query.season),
    ]);

    const counts = new Map<string, PresencaRow>();
    for (const presenca of presencas) {
      if (!presenca.socio) continue;
      const current =
        counts.get(presenca.socio.id) ?? { socioId: presenca.socio.id, name: presenca.socio.name, value: 0, totalBabas, percentual: 0 };
      current.value += 1;
      counts.set(presenca.socio.id, current);
    }

    return Array.from(counts.values())
      .map((row) => ({ ...row, percentual: totalBabas > 0 ? row.value / totalBabas : 0 }))
      .sort((a, b) => b.value - a.value);
  },
};
