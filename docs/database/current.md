# Banco de Dados — Estado Atual

> **Fonte da verdade do schema.** Sempre reflete o banco em produção/dev AGORA. Atualizado pelo agente `documentador` (comando `/documentar-banco`) a cada mudança de schema. Ao mudar, uma cópia do estado anterior é arquivada em `history/` antes de sobrescrever este arquivo.

- **Banco:** Supabase (Postgres gerenciado) via Prisma (`provider = "postgresql"`)
- **Versão do schema:** v002
- **Última atualização:** 2026-09-06
- **Migration correspondente:** ainda não aplicada — schema definido em `backend/prisma/schema.prisma`, aguardando provisionamento do projeto Supabase (`DATABASE_URL`/`DIRECT_URL`) para rodar `npx prisma migrate dev --name init` (ver observação abaixo).
- **Local do schema:** `backend/prisma/schema.prisma` (a arquitetura, `docs/planning/architecture.md`, definiu o Prisma dentro de `backend/`, e não em `database/`, para manter o Prisma Client próximo da camada de repository que o consome — `database/` permanece com o papel documental/README de referência do banco).

> **Observação importante:** este documento descreve o schema **definido em código** (fonte da verdade de modelagem). A aplicação efetiva da migration no Supabase depende de credenciais reais de banco (`backend/.env`, nunca versionado) — passo a ser executado na fase `/deploy` ou assim que o ambiente Supabase for provisionado. Até lá, rode `npx prisma generate` (já feito) para o Prisma Client funcionar localmente contra um Postgres de desenvolvimento à sua escolha.

## Enums

| Enum | Valores |
|---|---|
| `Role` | `DIRETOR`, `SOCIO` |
| `MemberStatus` | `A` (Ativo), `DM` (Departamento Médico), `I` (Inativo) |
| `PaymentMethod` | `PIX`, `DIN` |
| `ParticipantType` | `SOCIO`, `CONVIDADO` |
| `PlayerPosition` | `GOLEIRO`, `LINHA` |
| `EventType` | `GOL`, `CARTAO_AMARELO`, `CARTAO_AZUL`, `CARTAO_VERMELHO` |

## Tabelas

### User (autenticação)
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| email | text | não | — | único; login |
| passwordHash | text | não | — | bcrypt (12 salt rounds) |
| role | Role | não | — | DIRETOR ou SOCIO |
| socioId | uuid | sim | — | FK única para Socio (usuário sócio) |
| isActive | boolean | não | true | desativação sem exclusão |
| lastLoginAt | timestamptz | sim | — | auditoria de acesso |
| createdAt / updatedAt | timestamptz | não | now()/auto | — |

**Relacionamentos:** 1:1 com `Socio` (opcional — só usuários do papel SOCIO têm); 1:N com `PasswordResetToken`, `AuditLog`.
**Índices:** `email` (único), `socioId` (único).

### PasswordResetToken
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| userId | uuid | não | — | FK User |
| tokenHash | text | não | — | SHA-256 do token — nunca o token em claro |
| expiresAt | timestamptz | não | — | TTL de 1h |
| usedAt | timestamptz | sim | — | marca uso único |
| createdAt | timestamptz | não | now() | — |

**Índices:** `tokenHash` (único), `userId`.

### Socio (associados)
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| name | text | não | — | — |
| email | text | sim | — | único |
| phone | text | sim | — | — |
| memberSince | timestamptz | sim | — | — |
| defaultPosition | PlayerPosition | não | LINHA | posição sugerida no baba |
| createdAt / updatedAt | timestamptz | não | now()/auto | — |

**Relacionamentos:** 1:1 `User`; 1:N `SocioStatusMensal`, `SocioPayment`, `Presenca`, `Suspension`; 1:N `Convidado` (como "convidado por", relação `InvitedBy`).

### SocioStatusMensal (RF5 — histórico mensal, ADR-02)
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| socioId | uuid | não | — | FK Socio |
| referenceMonth | timestamptz | não | — | sempre dia 1 do mês |
| status | MemberStatus | não | — | A/DM/I |
| observation | text | sim | — | só quando DM; visível apenas ao diretor (RSP2) |
| setBy | uuid | não | — | userId do diretor |
| createdAt / updatedAt | timestamptz | não | now()/auto | — |

**Índices:** `[socioId, referenceMonth]` único; `referenceMonth`.
**Regra de negócio:** "status atual" nunca é lido direto — é resolvido por carry-forward (`socioStatus.service.ts`, ADR-02).

### Convidado
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| name | text | não | — | anonimizado para "Convidado removido" na remoção LGPD |
| phone | text | sim | — | anonimizado (null) na remoção LGPD |
| invitedById | uuid | sim | — | FK Socio (quem convidou) |
| contactRemovedAt | timestamptz | sim | — | marca remoção de contato (RSP6/RSP7) |
| createdAt / updatedAt | timestamptz | não | now()/auto | — |

**Relacionamentos:** 1:N `GuestPayment`, `Presenca`, `Suspension`.

### SocioPayment (mensalidades)
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| socioId | uuid | não | — | FK Socio |
| referenceMonth | timestamptz | não | — | dia 1 do mês |
| amount | decimal(10,2) | não | — | valor customizável |
| paymentMethod | PaymentMethod | não | — | PIX/DIN |
| paidAt | timestamptz | não | — | data efetiva do pagamento |
| registeredBy | uuid | não | — | userId do diretor |
| pixTxId | text | sim | — | reservado para integração futura (ADR-05) |
| createdAt | timestamptz | não | now() | — |

**Índices:** `[socioId, referenceMonth]` único (1 lançamento por sócio/mês); `referenceMonth`.
**Regra de negócio:** inadimplência = ausência de linha aqui para o sócio+mês (RF12/RNF8), nunca campo booleano.

### GuestPayment (pagamento avulso de convidado)
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| convidadoId | uuid | não | — | FK Convidado |
| babaDoDiaId | uuid | sim | — | FK BabaDoDia (opcional) |
| matchDate | timestamptz | não | — | domingo de referência |
| amount | decimal(10,2) | não | — | valor customizável |
| paymentMethod | PaymentMethod | não | — | — |
| paidAt | timestamptz | não | — | — |
| registeredBy | uuid | não | — | — |
| createdAt | timestamptz | não | now() | — |

**Índices:** `matchDate`.

### RevenueCategory / OtherRevenue
`RevenueCategory`: `id`, `name` (único), `isSystem` (true para "Mensalidades de sócios"/"Convidados" — não editáveis/inativáveis), `isActive`.
`OtherRevenue`: `id`, `categoryId` (FK), `referenceMonth`, `amount` decimal(10,2), `description`, `registeredBy`, `createdAt`. Índice: `referenceMonth`.

### ExpenseCategory / Expense
`ExpenseCategory`: `id`, `name` (único), `isActive`.
`Expense`: `id`, `categoryId` (FK), `weekStart`, `weekEnd`, `amount` decimal(10,2), `description`, `attachmentPath` (caminho no bucket privado `comprovantes`, nunca URL pública), `registeredBy`, `createdAt`. Índice: `weekStart`.
**Regra de negócio:** para efeito de saldo/dashboard mensal, o mês de referência de uma despesa é o mês de `weekStart`.

### MonthlyClosingBalance (saldo acumulado materializado — ADR-03)
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | uuid() | PK |
| referenceMonth | timestamptz | não | — | único |
| revenueTotal | decimal(10,2) | não | — | soma do mês |
| expenseTotal | decimal(10,2) | não | — | soma do mês |
| monthBalance | decimal(10,2) | não | — | revenueTotal - expenseTotal |
| cumulativeBalance | decimal(10,2) | não | — | saldo do mês anterior + monthBalance |
| calculatedAt | timestamptz | não | auto | — |

**Regra de negócio:** recalculado em cascata por `balance.service.ts` a cada escrita financeira (nunca somado do zero em cada leitura).

### AccountabilityReport (Prestação de Contas)
`id`, `referenceMonth` (único), `pdfPath` (bucket privado `relatorios-pdf`), `snapshot` (json — imutabilidade do relatório já publicado), `generatedBy`, `generatedAt`.

### BabaDoDia / Presenca / Team / TeamMember / GameEvent / Suspension (futebol)
- **BabaDoDia:** `id`, `date` (único, domingo), `time`, `location`, `createdBy`, `createdAt`. Índice: `date`.
- **Presenca:** `id`, `babaDoDiaId`, `participantType`, `socioId`/`convidadoId` (um dos dois), `position` (efetivo do dia). Únicos: `[babaDoDiaId, socioId]`, `[babaDoDiaId, convidadoId]`.
- **Team:** `id`, `babaDoDiaId`, `number` (1–4). Único: `[babaDoDiaId, number]`.
- **TeamMember:** `id`, `teamId`, `presencaId` (único — um jogador só pode estar em um time por baba). `presenca` com **`onDelete: Cascade`** (v002).
- **GameEvent:** `id`, `babaDoDiaId`, `presencaId`, `teamId?`, `type` (GOL/CARTAO_*), `registeredBy`, `createdAt`. Índice: `babaDoDiaId`. `presenca` com **`onDelete: Cascade`** (v002).
- **Suspension:** `id`, `originEventId` (único, FK GameEvent, **`onDelete: Cascade`** desde v002), `socioId`/`convidadoId`, `effectiveDate` (data do cartão + 7 dias), `liftedAt`/`liftedBy`/`liftReason` (override manual, RF30). Índice: `effectiveDate`.
  **Regra de negócio (ADR-04):** "está suspenso?" é sempre resolvido por função pura (`suspension.service.ts`), nunca por job agendado ou flag em `Socio`.
  **Correção v002 (code-review.md 🔴 #1 / security-report.md B3):** `TeamMember.presencaId` e `GameEvent.presencaId` eram relações obrigatórias sem `onDelete`, e o default do Postgres/Prisma (RESTRICT) fazia `PUT /babas/:id/presenca` quebrar com 500 sempre que o diretor reeditava a presença de um baba que já tinha sorteio/eventos lançados. A aplicação (`presencasRepository.replaceAll`) já apaga explicitamente, na mesma transação e na ordem correta (`Suspension` → `GameEvent`/`TeamMember` → `Presenca`), os vínculos das presenças substituídas — o `onDelete: Cascade` no schema é defesa em profundidade para qualquer outro caminho de deleção de `Presenca`/`GameEvent` que venha a existir. Toda substituição que de fato remove times/eventos já lançados é registrada em `AuditLog` (ação `presenca.replace_com_perda_de_dados`), para nunca perder rastro de um lançamento apagado (RNF5/RNF8).

### SystemConfig (single-row)
`id` (sempre 1), `defaultMonthlyFee` (default 110.00), `defaultGuestFee` (default 30.00), `currentSeason`, `pixKey`, `pixBeneficiaryName`, `pixBankName`, `pixCity`, `interIntegrationEnabled` (default false — ADR-05), `updatedAt`, `updatedBy`.
**Segurança:** nenhuma credencial da API do Inter é armazenada aqui — vive só em variáveis de ambiente do backend (RSP8).

### AuditLog (RNF5/RSP9)
`id`, `actorUserId` (FK User), `action` (ex.: `mensalidade.create`), `entityType`, `entityId`, `metadata` (json, dado mínimo — nunca duplica PII), `createdAt`. Índices: `actorUserId`, `[entityType, entityId]`.

## Observações de segurança
- Connection string só via `DATABASE_URL`/`DIRECT_URL` (env, nunca versionada) — `backend/.env.example` documenta as chaves sem valores.
- Todos os IDs são UUID (não sequenciais) — mitigação adicional contra enumeração de recursos (IDOR).
- Nenhuma tabela armazena segredo (credenciais Inter, chaves de API) — só variáveis de ambiente do backend.
- Anexos (`Expense.attachmentPath`) e PDFs (`AccountabilityReport.pdfPath`) referenciam buckets privados do Supabase Storage — acesso sempre via URL assinada de curta duração, nunca path público.
- RLS do Supabase: como todo acesso ao banco passa exclusivamente pelo backend (Prisma com a `DATABASE_URL` de aplicação, não a `SUPABASE_SERVICE_ROLE_KEY` do frontend), a autorização por papel/dono é garantida pelos middlewares do Express (`auth.middleware.ts`, `requireRole.middleware.ts`, `ownership.middleware.ts`) — recomenda-se ainda ativar RLS básico no Supabase como defesa em profundidade ao provisionar o projeto real.
