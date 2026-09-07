import crypto from 'node:crypto';

// Fake mínimo do Prisma Client, em memória, usado só para reproduzir determinísticamente
// (sem depender de um Postgres real, indisponível neste ambiente de QA) o comportamento de
// integridade referencial descrito em docs/planning/code-review.md 🔴 #1: relações obrigatórias
// (`TeamMember.presencaId`, `GameEvent.presencaId`) sem `onDelete: Cascade` -> Postgres/Prisma
// usam RESTRICT por padrão, então DELETE em uma Presenca referenciada falha com P2003 — a menos
// que quem for apagar a Presenca já tenha apagado antes, explicitamente, os vínculos
// dependentes (Suspension -> GameEvent/TeamMember), que é exatamente o que a correção do bug
// em `presencasRepository.replaceAll` passou a fazer, na mesma transação.
//
// Não é um clone do Prisma — só simula os métodos realmente chamados pelos repositories
// exercitados nestes testes de integração, com a MESMA semântica de restrição de FK.

export interface FakeRow {
  id: string;
  [key: string]: unknown;
}

type WhereValue = unknown | { in: unknown[] };

class PrismaKnownRequestErrorLike extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = code;
  }
}

function matchValue(actual: unknown, condition: WhereValue): boolean {
  if (condition && typeof condition === 'object' && 'in' in (condition as Record<string, unknown>)) {
    return (condition as { in: unknown[] }).in.includes(actual);
  }
  return actual === condition;
}

function matches(row: FakeRow, where: Record<string, unknown> = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    return matchValue(row[key], value as WhereValue);
  });
}

export function createFakePrisma() {
  const tables = {
    babaDoDia: new Map<string, FakeRow>(),
    presenca: new Map<string, FakeRow>(),
    team: new Map<string, FakeRow>(),
    teamMember: new Map<string, FakeRow>(),
    gameEvent: new Map<string, FakeRow>(),
    suspension: new Map<string, FakeRow>(),
  };

  const presencaModel = {
    async findMany({ where }: { where?: Record<string, unknown> } = {}) {
      return [...tables.presenca.values()].filter((row) => matches(row, where));
    },
    async findUnique({ where }: { where: { id: string } }) {
      return tables.presenca.get(where.id) ?? null;
    },
    async deleteMany({ where }: { where?: Record<string, unknown> } = {}) {
      const targets = [...tables.presenca.values()].filter((row) => matches(row, where));

      // RESTRICT: se qualquer TeamMember ou GameEvent ainda referencia a presença,
      // o Postgres recusa o DELETE (violação de FK). O código de produção corrigido
      // (presencasRepository.replaceAll) já apaga esses vínculos antes de chegar aqui;
      // este `throw` continua existindo para o caso de algum chamador futuro esquecer.
      for (const target of targets) {
        const blockedByTeamMember = [...tables.teamMember.values()].some((tm) => tm.presencaId === target.id);
        const blockedByGameEvent = [...tables.gameEvent.values()].some((ge) => ge.presencaId === target.id);
        if (blockedByTeamMember || blockedByGameEvent) {
          throw new PrismaKnownRequestErrorLike(
            `Foreign key constraint failed on the field: \`presencaId\` (Presenca id=${target.id} ainda referenciada por TeamMember/GameEvent)`,
            'P2003'
          );
        }
      }

      for (const target of targets) tables.presenca.delete(target.id);
      return { count: targets.length };
    },
    async createMany({ data }: { data: Array<Record<string, unknown>> }) {
      for (const item of data) {
        const id = (item.id as string) ?? crypto.randomUUID();
        tables.presenca.set(id, { ...item, id } as FakeRow);
      }
      return { count: data.length };
    },
  };

  // TeamMember: suporta filtro direto (presencaId, inclusive `{ in: [...] }`) e o filtro
  // aninhado `{ presenca: { babaDoDiaId } }` usado por presencasRepository.countDependents.
  function teamMemberMatches(row: FakeRow, where: Record<string, unknown> = {}): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === 'presenca') {
        const presenca = tables.presenca.get(row.presencaId as string);
        if (!presenca) return false;
        return Object.entries(value as Record<string, unknown>).every(([pKey, pValue]) =>
          matchValue(presenca[pKey], pValue as WhereValue)
        );
      }
      return matchValue(row[key], value as WhereValue);
    });
  }

  const teamMemberModel = {
    async create({ data }: { data: Record<string, unknown> }) {
      const id = (data.id as string) ?? crypto.randomUUID();
      const row = { ...data, id } as FakeRow;
      tables.teamMember.set(id, row);
      return row;
    },
    async deleteMany({ where }: { where?: Record<string, unknown> } = {}) {
      const targets = [...tables.teamMember.values()].filter((row) => teamMemberMatches(row, where));
      for (const target of targets) tables.teamMember.delete(target.id);
      return { count: targets.length };
    },
    async count({ where }: { where?: Record<string, unknown> } = {}) {
      return [...tables.teamMember.values()].filter((row) => teamMemberMatches(row, where)).length;
    },
  };

  const gameEventModel = {
    async create({ data }: { data: Record<string, unknown> }) {
      const id = (data.id as string) ?? crypto.randomUUID();
      const row = { ...data, id } as FakeRow;
      tables.gameEvent.set(id, row);
      return row;
    },
    async deleteMany({ where }: { where?: Record<string, unknown> } = {}) {
      const targets = [...tables.gameEvent.values()].filter((row) => matches(row, where));
      for (const target of targets) tables.gameEvent.delete(target.id);
      return { count: targets.length };
    },
    async count({ where }: { where?: Record<string, unknown> } = {}) {
      return [...tables.gameEvent.values()].filter((row) => matches(row, where)).length;
    },
  };

  // Suspension: suporta o filtro aninhado `{ originEvent: { presencaId: { in: [...] } } }`
  // usado por presencasRepository.replaceAll para limpar suspensões antes de apagar o GameEvent
  // de origem (Suspension.originEventId é FK obrigatória e única para GameEvent).
  function suspensionMatches(row: FakeRow, where: Record<string, unknown> = {}): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value === undefined) return true;
      if (key === 'originEvent') {
        const originEvent = tables.gameEvent.get(row.originEventId as string);
        if (!originEvent) return false;
        return Object.entries(value as Record<string, unknown>).every(([oKey, oValue]) =>
          matchValue(originEvent[oKey], oValue as WhereValue)
        );
      }
      return matchValue(row[key], value as WhereValue);
    });
  }

  const suspensionModel = {
    async create({ data }: { data: Record<string, unknown> }) {
      const id = (data.id as string) ?? crypto.randomUUID();
      const row = { ...data, id } as FakeRow;
      tables.suspension.set(id, row);
      return row;
    },
    async deleteMany({ where }: { where?: Record<string, unknown> } = {}) {
      const targets = [...tables.suspension.values()].filter((row) => suspensionMatches(row, where));
      for (const target of targets) tables.suspension.delete(target.id);
      return { count: targets.length };
    },
  };

  const fakePrisma = {
    __tables: tables,
    presenca: presencaModel,
    babaDoDia: {
      async findUnique({ where }: { where: { id: string } }) {
        return tables.babaDoDia.get(where.id) ?? null;
      },
    },
    teamMember: teamMemberModel,
    gameEvent: gameEventModel,
    suspension: suspensionModel,
    // As transações reais do Postgres não têm efeito aqui além de repassar o mesmo cliente —
    // suficiente para os testes de integridade referencial (não estamos testando rollback).
    async $transaction<T>(callback: (tx: typeof fakePrisma) => Promise<T>): Promise<T> {
      return callback(fakePrisma);
    },
  };

  return fakePrisma;
}

export type FakePrisma = ReturnType<typeof createFakePrisma>;
