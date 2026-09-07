import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakePrisma } from '../helpers/fakePrisma';

// Reproduz o bug 🔴 #1 do code-review.md: PUT /babas/:id/presenca quebra quando o diretor
// tenta reeditar a presença de um baba que já tem TeamMember/GameEvent vinculados, porque
// `TeamMember.presencaId`/`GameEvent.presencaId` são relações obrigatórias sem
// `onDelete: Cascade` (default do Postgres/Prisma = RESTRICT) e
// `presencasRepository.replaceAll` faz um `deleteMany` cego antes de recriar a lista.
//
// Não há Postgres disponível neste ambiente de QA para rodar contra o schema real — o teste
// usa um fake Prisma (tests/helpers/fakePrisma.ts) que reproduz fielmente a semântica RESTRICT
// da FK (mesmo comportamento que o Postgres real teria dado o schema atual, não simulado "por
// conveniência"). O código exercitado (`presencasRepository`, `presencaService`) é o código de
// produção real, inalterado.
vi.mock('../../src/lib/prisma', async () => {
  const { createFakePrisma } = await import('../helpers/fakePrisma');
  return { prisma: createFakePrisma() };
});

describe('BUG conhecido (code-review.md 🔴 #1) — PUT /babas/:id/presenca com times/eventos já lançados', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('presencasRepository.replaceAll lança erro (P2003) ao tentar remover uma Presenca ainda referenciada por TeamMember', async () => {
    const { prisma } = (await import('../../src/lib/prisma')) as unknown as { prisma: FakePrisma };
    const { presencasRepository } = await import('../../src/repositories/presencas.repository');

    const babaDoDiaId = 'baba-1';
    prisma.__tables.presenca.set('presenca-1', {
      id: 'presenca-1',
      babaDoDiaId,
      participantType: 'SOCIO',
      socioId: 'socio-1',
      position: 'LINHA',
    });
    // Sorteio já rodou: presenca-1 está em um time (TeamMember é FK obrigatória para Presenca).
    prisma.__tables.teamMember.set('tm-1', { id: 'tm-1', teamId: 'team-1', presencaId: 'presenca-1' });

    // Diretor tenta reeditar a lista de presença (ex.: incluir um atrasado) — RF26 / fluxo real de domingo.
    // Comportamento ESPERADO pelo negócio: a edição deveria funcionar (ou falhar com um erro de
    // domínio tratado, nunca um 500 genérico vazando P2003). Esta asserção falha HOJE de propósito
    // — reproduz o bug 🔴 #1 do code-review.md para o dev-senior corrigir antes do /deploy.
    await expect(
      presencasRepository.replaceAll(babaDoDiaId, [
        { babaDoDiaId, participantType: 'SOCIO', socioId: 'socio-2', position: 'LINHA' } as never,
      ])
    ).resolves.toHaveLength(1);
  });

  it('presencasRepository.replaceAll lança erro (P2003) quando a Presenca já tem GameEvent (gol/cartão) registrado', async () => {
    const { prisma } = (await import('../../src/lib/prisma')) as unknown as { prisma: FakePrisma };
    const { presencasRepository } = await import('../../src/repositories/presencas.repository');

    const babaDoDiaId = 'baba-2';
    prisma.__tables.presenca.set('presenca-2', {
      id: 'presenca-2',
      babaDoDiaId,
      participantType: 'SOCIO',
      socioId: 'socio-3',
      position: 'LINHA',
    });
    // Diretor já registrou um gol para esse jogador (GameEvent.presencaId é FK obrigatória).
    prisma.__tables.gameEvent.set('ge-1', {
      id: 'ge-1',
      babaDoDiaId,
      presencaId: 'presenca-2',
      type: 'GOL',
      registeredBy: 'diretor-1',
    });

    // Também falha hoje pelo mesmo motivo (P2003), agora pela FK de GameEvent.
    await expect(
      presencasRepository.replaceAll(babaDoDiaId, [
        { babaDoDiaId, participantType: 'SOCIO', socioId: 'socio-3', position: 'GOLEIRO' } as never,
      ])
    ).resolves.toHaveLength(1);
  });

  it('replaceAll funciona normalmente quando NÃO há TeamMember/GameEvent vinculado (caso feliz, não afetado pelo bug)', async () => {
    const { prisma } = (await import('../../src/lib/prisma')) as unknown as { prisma: FakePrisma };
    const { presencasRepository } = await import('../../src/repositories/presencas.repository');

    const babaDoDiaId = 'baba-3';
    prisma.__tables.presenca.set('presenca-3', {
      id: 'presenca-3',
      babaDoDiaId,
      participantType: 'SOCIO',
      socioId: 'socio-4',
      position: 'LINHA',
    });

    const result = await presencasRepository.replaceAll(babaDoDiaId, [
      { babaDoDiaId, participantType: 'SOCIO', socioId: 'socio-5', position: 'LINHA' } as never,
    ]);

    expect(result).toHaveLength(1);
    expect((result[0] as { socioId?: string }).socioId).toBe('socio-5');
  });
});
