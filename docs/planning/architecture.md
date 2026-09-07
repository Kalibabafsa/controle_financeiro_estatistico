# Arquitetura — Sistema Kalibaba

> Gerado pela fase `/arquitetar`, a partir de `docs/planning/prd.md` (PRD + 26 telas do inventário) e `docs/design-system.md` (26 protótipos aprovados em `prototipo/`). Fonte da verdade técnica para a fase `/desenvolver`.

## 1. Visão geral

O sistema é composto por três camadas fisicamente separadas, sem acesso direto entre front e banco:

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────────┐        SQL (Prisma)        ┌───────────────────────┐
│  FRONTEND (Vercel)       │ ───────────────────────▶ │  BACKEND (Render)             │ ─────────────────────────▶ │  BANCO (Supabase)      │
│  Next.js + React + TS    │ ◀─────────────────────── │  Node + Express + TS          │ ◀───────────────────────── │  Postgres gerenciado   │
│  Tailwind + Zod          │                           │  server→app→routes→          │                             │  + Supabase Storage    │
│  app/ (rotas por papel)  │                           │  controllers→services→        │                             │  (comprovantes, PDFs)  │
│  features/<feature>/     │                           │  repositories                 │                             │                        │
└─────────────────────────┘                           └──────────────────────────────┘                             └───────────────────────┘
        ▲                                                        │
        │ (sem acesso direto)                                    │ gera / lê arquivos
        └────────────────────────────────────────────────────────┴──▶ Supabase Storage (buckets privados: comprovantes, relatorios-pdf)
```

Regras inegociáveis (já fixadas no `CLAUDE.md`/`convencoes.md`, reafirmadas aqui):
- O frontend nunca acessa o Supabase/Postgres diretamente nem detém a `SUPABASE_SERVICE_ROLE_KEY`. Toda leitura/escrita passa pelo backend.
- No backend, **controller → service → repository**, sem atalhos. Só o `repository` importa o Prisma Client.
- Toda rota protegida passa por middleware de autenticação (JWT) + autorização (papel/dono do recurso).
- Zod valida toda entrada em ambas as camadas (formulário no front, payload/params/query no back).

## 2. Modelo de dados

### 2.1 Decisões de modelagem (resumo — detalhadas nos ADRs, seção 6)

- **Status do sócio é histórico mensal** (`SocioStatusMensal`), não um campo estático em `Socio`. O "status atual" é sempre a leitura do mês corrente nessa tabela (com regra de carry-forward — ver ADR-02).
- **Inadimplência não é campo booleano** — é calculada pela ausência de linha em `SocioPayment` para o sócio+mês (RF12/RNF8).
- **Saldo acumulado é materializado incrementalmente** em `MonthlyClosingBalance`, não recalculado do zero a cada leitura (ver ADR-03).
- **Suspensão por cartão vermelho é computável a qualquer momento**, não depende de job agendado — materializada em `Suspension` no momento do cartão vermelho, mas consultável via função pura de serviço (ver ADR-04).
- **Categorias de receita/despesa são cadastráveis** (tabelas próprias, não enum).
- **Convidado suporta remoção de dados de contato (LGPD)** preservando o vínculo financeiro anonimizado (`contactRemovedAt`, nome/telefone limpos, `id` preservado).

### 2.2 Schema Prisma (proposto)

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (pgbouncer, porta 6543) — para a aplicação
  directUrl = env("DIRECT_URL")     // direta (porta 5432) — para migrations
}

// ---------- Enums ----------

enum Role {
  DIRETOR
  SOCIO
}

enum MemberStatus {
  A   // Ativo
  DM  // Departamento Médico
  I   // Inativo
}

enum PaymentMethod {
  PIX
  DIN
}

enum ParticipantType {
  SOCIO
  CONVIDADO
}

enum PlayerPosition {
  GOLEIRO
  LINHA
}

enum EventType {
  GOL
  CARTAO_AMARELO
  CARTAO_AZUL
  CARTAO_VERMELHO
}

// ---------- Autenticação ----------

model User {
  id                  String    @id @default(uuid())
  email               String    @unique
  passwordHash        String
  role                Role
  socio               Socio?    @relation(fields: [socioId], references: [id])
  socioId             String?   @unique
  isActive            Boolean   @default(true)
  lastLoginAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  passwordResetTokens PasswordResetToken[]
  auditLogs           AuditLog[]
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  user      User      @relation(fields: [userId], references: [id])
  userId    String
  tokenHash String    @unique // nunca armazenar o token em claro
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

// ---------- Associados ----------

model Socio {
  id              String   @id @default(uuid())
  name            String
  email           String?  @unique
  phone           String?
  memberSince     DateTime?
  defaultPosition PlayerPosition @default(LINHA)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User?
  statusHistory   SocioStatusMensal[]
  payments        SocioPayment[]
  presencas       Presenca[]
  invitedGuests   Convidado[]  @relation("InvitedBy")
  suspensions     Suspension[]
}

model SocioStatusMensal {
  id             String       @id @default(uuid())
  socio          Socio        @relation(fields: [socioId], references: [id])
  socioId        String
  referenceMonth DateTime     // sempre dia 1 do mês, ex.: 2026-08-01
  status         MemberStatus
  observation    String?      // preenchido só quando status = DM; visível apenas ao diretor (RSP2)
  setBy          String       // userId do diretor que registrou
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([socioId, referenceMonth])
  @@index([referenceMonth])
}

model Convidado {
  id               String   @id @default(uuid())
  name             String
  phone            String?
  invitedBy        Socio?   @relation("InvitedBy", fields: [invitedById], references: [id])
  invitedById      String?
  contactRemovedAt DateTime? // LGPD: quando não nulo, name/phone já foram anonimizados
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  payments         GuestPayment[]
  presencas        Presenca[]
  suspensions      Suspension[]
}

// ---------- Financeiro ----------

model SocioPayment {
  id             String        @id @default(uuid())
  socio          Socio         @relation(fields: [socioId], references: [id])
  socioId        String
  referenceMonth DateTime      // dia 1 do mês de referência
  amount         Decimal       @db.Decimal(10, 2)
  paymentMethod  PaymentMethod
  paidAt         DateTime
  registeredBy   String        // userId do diretor
  pixTxId        String?       // reservado para integração automática futura (ADR-05)
  createdAt      DateTime      @default(now())

  @@unique([socioId, referenceMonth]) // 1 lançamento de mensalidade por sócio/mês (valor customizável cobre parcelas/ajustes)
  @@index([referenceMonth])
}

model GuestPayment {
  id            String        @id @default(uuid())
  convidado     Convidado     @relation(fields: [convidadoId], references: [id])
  convidadoId   String
  babaDoDia     BabaDoDia?    @relation(fields: [babaDoDiaId], references: [id])
  babaDoDiaId   String?
  matchDate     DateTime      // domingo de referência
  amount        Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  paidAt        DateTime
  registeredBy  String
  createdAt     DateTime      @default(now())

  @@index([matchDate])
}

model RevenueCategory {
  id            String   @id @default(uuid())
  name          String   @unique
  isSystem      Boolean  @default(false) // "Mensalidades de sócios" e "Convidados" são derivadas, não cadastráveis/inativáveis
  isActive      Boolean  @default(true)
  otherRevenues OtherRevenue[]
}

model OtherRevenue {
  id             String          @id @default(uuid())
  category       RevenueCategory @relation(fields: [categoryId], references: [id])
  categoryId     String
  referenceMonth DateTime
  amount         Decimal         @db.Decimal(10, 2)
  description    String?
  registeredBy   String
  createdAt      DateTime        @default(now())

  @@index([referenceMonth])
}

model ExpenseCategory {
  id       String    @id @default(uuid())
  name     String    @unique
  isActive Boolean   @default(true)
  expenses Expense[]
}

model Expense {
  id             String           @id @default(uuid())
  category       ExpenseCategory  @relation(fields: [categoryId], references: [id])
  categoryId     String
  weekStart      DateTime
  weekEnd        DateTime
  amount         Decimal          @db.Decimal(10, 2)
  description    String?
  attachmentPath String?          // caminho no bucket privado do Supabase Storage (não a URL pública)
  registeredBy   String
  createdAt      DateTime         @default(now())

  @@index([weekStart])
}

// Saldo acumulado materializado — ver ADR-03
model MonthlyClosingBalance {
  id                String   @id @default(uuid())
  referenceMonth    DateTime @unique
  revenueTotal      Decimal  @db.Decimal(10, 2)
  expenseTotal      Decimal  @db.Decimal(10, 2)
  monthBalance      Decimal  @db.Decimal(10, 2) // revenueTotal - expenseTotal
  cumulativeBalance Decimal  @db.Decimal(10, 2) // saldo do mês anterior + monthBalance
  calculatedAt      DateTime @updatedAt
}

model AccountabilityReport { // Prestação de Contas
  id             String   @id @default(uuid())
  referenceMonth DateTime @unique
  pdfPath        String   // caminho no bucket privado "relatorios-pdf"
  snapshot       Json     // números usados na geração (imutabilidade do relatório já publicado)
  generatedBy    String
  generatedAt    DateTime @default(now())
}

// ---------- Futebol (Baba do dia) ----------

model BabaDoDia {
  id            String   @id @default(uuid())
  date          DateTime @unique // domingo
  time          String?          // "08:00"
  location      String?
  createdBy     String
  createdAt     DateTime @default(now())

  presencas     Presenca[]
  teams         Team[]
  events        GameEvent[]
  guestPayments GuestPayment[]

  @@index([date])
}

model Presenca {
  id              String          @id @default(uuid())
  babaDoDia       BabaDoDia       @relation(fields: [babaDoDiaId], references: [id])
  babaDoDiaId     String
  participantType ParticipantType
  socio           Socio?          @relation(fields: [socioId], references: [id])
  socioId         String?
  convidado       Convidado?      @relation(fields: [convidadoId], references: [id])
  convidadoId     String?
  position        PlayerPosition  // efetivo do dia (default = Socio.defaultPosition, ajustável)
  createdAt       DateTime        @default(now())

  teamMember      TeamMember?
  events          GameEvent[]

  @@unique([babaDoDiaId, socioId])
  @@unique([babaDoDiaId, convidadoId])
}

model Team {
  id          String       @id @default(uuid())
  babaDoDia   BabaDoDia    @relation(fields: [babaDoDiaId], references: [id])
  babaDoDiaId String
  number      Int          // 1 a 4
  members     TeamMember[]
  events      GameEvent[]

  @@unique([babaDoDiaId, number])
}

model TeamMember {
  id         String   @id @default(uuid())
  team       Team     @relation(fields: [teamId], references: [id])
  teamId     String
  presenca   Presenca @relation(fields: [presencaId], references: [id])
  presencaId String   @unique
}

model GameEvent {
  id           String     @id @default(uuid())
  babaDoDia    BabaDoDia  @relation(fields: [babaDoDiaId], references: [id])
  babaDoDiaId  String
  presenca     Presenca   @relation(fields: [presencaId], references: [id])
  presencaId   String
  team         Team?      @relation(fields: [teamId], references: [id])
  teamId       String?
  type         EventType
  registeredBy String
  createdAt    DateTime   @default(now())

  suspension   Suspension?

  @@index([babaDoDiaId])
}

// Materializada no momento do cartão vermelho, mas o status "está suspenso?" é sempre
// recalculado por função de serviço pura — ver ADR-04.
model Suspension {
  id            String     @id @default(uuid())
  originEvent   GameEvent  @relation(fields: [originEventId], references: [id])
  originEventId String     @unique
  socio         Socio?     @relation(fields: [socioId], references: [id])
  socioId       String?
  convidado     Convidado? @relation(fields: [convidadoId], references: [id])
  convidadoId   String?
  effectiveDate DateTime   // domingo seguinte ao cartão (data de origem + 7 dias)
  liftedAt      DateTime?  // override manual do diretor (RF30)
  liftedBy      String?
  liftReason    String?
  createdAt     DateTime   @default(now())

  @@index([effectiveDate])
}

// ---------- Configurações e auditoria ----------

model SystemConfig {
  id                      Int      @id @default(1) // single-row config
  defaultMonthlyFee       Decimal  @db.Decimal(10, 2) @default(110.00)
  defaultGuestFee         Decimal  @db.Decimal(10, 2) @default(30.00)
  currentSeason           Int
  pixKey                  String?
  pixBeneficiaryName      String?
  pixBankName             String?
  pixCity                 String?
  interIntegrationEnabled Boolean  @default(false) // liga o InterPixGateway quando viável — ver ADR-05
  updatedAt               DateTime @updatedAt
  updatedBy               String?
}

model AuditLog {
  id          String   @id @default(uuid())
  actor       User     @relation(fields: [actorUserId], references: [id])
  actorUserId String
  action      String   // ex.: "mensalidade.create", "socio.status.update", "convidado.contato.remover"
  entityType  String
  entityId    String?
  metadata    Json?    // dado mínimo (RSP9) — nunca duplicar PII/dado sensível aqui
  createdAt   DateTime @default(now())

  @@index([actorUserId])
  @@index([entityType, entityId])
}
```

**Observações de modelagem:**
- Todos os `id` são UUID (não sequenciais) para evitar enumeração de recursos (mitigação IDOR adicional).
- Nenhum campo armazena segredo (client_id/secret/certificado Inter) — isso vive só em variáveis de ambiente do backend (RSP8), nunca no banco.
- `SocioPayment` e `GuestPayment` não têm campo de "status pendente": a existência do registro **é** a confirmação (RF12). O estado "aguardando confirmação" mostrado ao sócio em `pagar-mensalidade.html` é um estado de UI (ainda não existe lançamento), não um registro no banco.

## 3. Contratos de API

Convenção: prefixo `/api`. Autenticação via JWT (Bearer no header `Authorization`, access token curto + refresh token em cookie `HttpOnly`/`Secure`/`SameSite=Strict`). Toda rota abaixo (exceto `/auth/*`) exige token válido; a coluna **Autorização** detalha o papel/regra adicional.

### 3.1 Autenticação e perfil

| Método/Rota | Autorização | Request | Response | Tela(s) |
|---|---|---|---|---|
| `POST /api/auth/login` | Pública | `{ email, password }` | `{ accessToken, user: { id, role, name } }` + cookie refresh | `login.html` |
| `POST /api/auth/refresh` | Cookie de refresh válido | — | `{ accessToken }` | (silencioso, todas) |
| `POST /api/auth/logout` | Autenticado | — | `204` (limpa cookie) | Sair (todas) |
| `POST /api/auth/forgot-password` | Pública, rate-limited | `{ email }` | `202` (sempre, sem enumeração) | `recuperar-senha.html` |
| `POST /api/auth/reset-password` | Token de reset válido | `{ token, newPassword }` | `204` | `recuperar-senha.html` |
| `GET /api/me` | Autenticado | — | `{ id, role, socio? }` | Todas (bootstrap de sessão) |
| `GET /api/me/perfil` | Sócio (self) | — | dados cadastrais do próprio sócio | `meu-perfil.html` |
| `PATCH /api/me/perfil` | Sócio (self) | `{ phone, email? }` | dados atualizados | `meu-perfil.html` |

### 3.2 Sócios e status mensal (diretor)

| Método/Rota | Autorização | Request | Response | Tela(s) |
|---|---|---|---|---|
| `GET /api/socios` | Diretor | query `search, status, page, pageSize` | lista paginada | `socios-lista.html` |
| `POST /api/socios` | Diretor | dados cadastrais | sócio criado | `socio-form.html` |
| `GET /api/socios/:id` | Diretor **ou** Sócio dono | — | dados + status atual (observação DM só se diretor) | `socio-form.html`, `meu-perfil.html` |
| `PATCH /api/socios/:id` | Diretor | dados cadastrais | sócio atualizado | `socio-form.html` |
| `PATCH /api/socios/:id/status` | Diretor | `{ referenceMonth, status, observation? }` | status do mês criado/atualizado | `socio-form.html` |
| `GET /api/socios/:id/status-history` | Diretor **ou** Sócio dono | — | histórico mensal (observação DM oculta se não-diretor) | `socio-form.html`, `meu-perfil.html` |

### 3.3 Convidados (diretor)

| Método/Rota | Autorização | Request | Response | Tela(s) |
|---|---|---|---|---|
| `GET /api/convidados` | Diretor | `search, page` | lista paginada | `convidados-lista.html` |
| `POST /api/convidados` | Diretor | `{ name, phone?, invitedById? }` | convidado criado | `convidado-form.html` |
| `GET /api/convidados/:id` | Diretor | — | dados + histórico de participações | `convidado-form.html` |
| `PATCH /api/convidados/:id` | Diretor | dados cadastrais | convidado atualizado | `convidado-form.html` |
| `POST /api/convidados/:id/remover-contato` | Diretor | — | `204` (anonimiza name/phone, seta `contactRemovedAt`, preserva pagamentos) | `convidado-form.html` |

### 3.4 Financeiro — mensalidades, convidados, despesas, categorias, saldo

| Método/Rota | Autorização | Request | Response | Tela(s) |
|---|---|---|---|---|
| `GET /api/mensalidades?socioId=&month=` | Diretor | query | lista de lançamentos | `dashboard-financeiro.html`, `lancamento-mensalidade.html` |
| `POST /api/mensalidades` | Diretor | `{ socioId, referenceMonth, amount, paymentMethod, paidAt }` | lançamento criado; dispara recálculo de saldo (ADR-03) | `lancamento-mensalidade.html` |
| `GET /api/me/mensalidades` | Sócio (self) | query `year?` | histórico de pagamentos do próprio sócio | `situacao-financeira.html`, `home-socio.html` |
| `GET /api/me/situacao` | Sócio (self) | — | status do mês corrente + próximo vencimento | `home-socio.html` |
| `GET /api/pagamentos-convidados?convidadoId=&month=` | Diretor | query | lista | `dashboard-financeiro.html` |
| `POST /api/pagamentos-convidados` | Diretor | `{ convidadoId, matchDate, babaDoDiaId?, amount, paymentMethod, paidAt }` | lançamento criado | `lancamento-convidado.html` |
| `GET /api/despesas?month=` | Diretor | query | lista + total do mês | `despesas.html` |
| `POST /api/despesas` | Diretor | multipart: `categoryId, weekStart, weekEnd, amount, description?, attachment?` | despesa criada; upload no bucket privado | `despesas.html` |
| `GET /api/despesas/:id/anexo` | Diretor | — | URL assinada temporária (Supabase Storage) | `despesas.html` |
| `GET /api/categorias/despesas` | Diretor | — | lista | `categorias.html`, `despesas.html` |
| `POST /api/categorias/despesas` | Diretor | `{ name }` | categoria criada | `categorias.html` |
| `PATCH /api/categorias/despesas/:id` | Diretor | `{ name?, isActive? }` | categoria atualizada | `categorias.html` |
| `GET /api/categorias/receitas` | Diretor | — | lista (com `isSystem`) | `categorias.html` |
| `POST /api/categorias/receitas` | Diretor | `{ name }` | categoria criada | `categorias.html` |
| `PATCH /api/categorias/receitas/:id` | Diretor | `{ name?, isActive? }` — bloqueado se `isSystem` | categoria atualizada | `categorias.html` |
| `GET /api/receitas-outras?month=` | Diretor | query | lista | `dashboard-financeiro.html` |
| `POST /api/receitas-outras` | Diretor | `{ categoryId, referenceMonth, amount, description? }` | receita criada | (fluxo dentro de Despesas/Categorias — reaproveita padrão) |
| `GET /api/dashboard/financeiro?month=` | Diretor | query | KPIs completos (saldo, receitas, despesas, inadimplência, sócios ativos, série 6 meses) | `dashboard-financeiro.html` |
| `GET /api/situacao-geral` | Sócio | — | KPIs agregados apenas (sem identificar inadimplentes) | `home-socio.html` |
| `GET /api/inadimplencia?month=` | Diretor | query | sócios ativos sem lançamento no mês (exclui DM, salvo override já lançado) | `inadimplencia.html`, `dashboard-financeiro.html` |

### 3.5 Prestação de Contas e Pix

| Método/Rota | Autorização | Request | Response | Tela(s) |
|---|---|---|---|---|
| `GET /api/prestacoes` | Diretor + Sócio | — | lista de meses já gerados | `prestacao-contas.html`, `prestacao-contas-geracao.html` |
| `GET /api/prestacoes/:month/preview` | Diretor | — | dados agregados do mês (antes de gerar o PDF) | `prestacao-contas-geracao.html` |
| `POST /api/prestacoes` | Diretor | `{ referenceMonth }` | gera PDF (Puppeteer), salva `snapshot` + `pdfPath`, publica para sócios | `prestacao-contas-geracao.html` |
| `GET /api/prestacoes/:month/pdf` | Diretor + Sócio | — | redirect/URL assinada para o PDF | `prestacao-contas.html`, `prestacao-contas-geracao.html` |
| `GET /api/pix/payload` | Diretor + Sócio | query `amount?, referenceMonth?` | `{ emvPayload, pixKey }` (payload BR Code gerado no backend a partir do `SystemConfig`) | `pagar-mensalidade.html`, `configuracoes.html` |
| `PATCH /api/config/pix` | Diretor | `{ pixKey, pixBeneficiaryName, pixBankName, pixCity }` | config atualizada | `configuracoes.html` |
| `POST /api/webhooks/inter-pix` *(reservado, desativado)* | Assinatura mTLS/HMAC do Inter | payload do Inter | `200` | (nenhuma — integração futura, ADR-05) |

### 3.6 Futebol — baba do dia, sorteio, eventos, suspensões, rankings

| Método/Rota | Autorização | Request | Response | Tela(s) |
|---|---|---|---|---|
| `GET /api/babas?page=` | Diretor + Sócio | query | lista de babas (paginada) | `proximo-baba.html` (histórico) |
| `POST /api/babas` | Diretor | `{ date, time?, location? }` | baba criado | `baba-dia.html` |
| `GET /api/babas/:id` | Diretor + Sócio | — | detalhe (dados, presença, times, eventos) | `baba-dia.html`, `detalhe-baba.html` |
| `PATCH /api/babas/:id` | Diretor | `{ time?, location? }` | atualizado | `baba-dia.html` |
| `PUT /api/babas/:id/presenca` | Diretor | `{ participants: [{ type, socioId|convidadoId, position }] }` | lista de presença substituída (bloqueia suspensos, salvo override) | `baba-dia.html` |
| `POST /api/babas/:id/sorteio` | Diretor | — | 4 times sorteados (1 goleiro + 6 linha), respeitando suspensões | `sorteio-times.html` |
| `PUT /api/babas/:id/times` | Diretor | `{ teams: [{ number, presencaIds[] }] }` | times salvos (ajuste manual) | `sorteio-times.html` |
| `GET /api/babas/:id/eventos` | Diretor + Sócio | — | lista de gols/cartões do dia | `gols-cartoes.html`, `detalhe-baba.html` |
| `POST /api/babas/:id/eventos` | Diretor | `{ presencaId, teamId?, type }` | evento criado; se `CARTAO_VERMELHO`, materializa `Suspension` | `gols-cartoes.html` |
| `DELETE /api/eventos/:id` | Diretor | — | `204`; remove `Suspension` associada se existir | `gols-cartoes.html` |
| `GET /api/me/proximo-baba` | Sócio (self) | — | data do próximo baba + `apto`/`suspenso` (ADR-04) | `home-socio.html`, `proximo-baba.html` |
| `GET /api/suspensoes` | Diretor | — | ativas (próximo domingo) + histórico | `suspensoes.html` |
| `POST /api/suspensoes/:id/liberar` | Diretor | `{ reason? }` | override manual (RF30) | `suspensoes.html` |
| `GET /api/rankings?season=&type=artilheiros\|cartoes\|presenca` | Diretor + Sócio | query | ranking ordenado (convidados excluídos, RF9) | `rankings.html` |

### 3.7 Configurações gerais

| Método/Rota | Autorização | Request | Response | Tela(s) |
|---|---|---|---|---|
| `GET /api/config` | Diretor | — | config completa (sem segredos) | `configuracoes.html` |
| `PATCH /api/config/valores-padrao` | Diretor | `{ defaultMonthlyFee, defaultGuestFee }` | atualizado | `configuracoes.html` |
| `PATCH /api/config/temporada` | Diretor | `{ currentSeason }` | atualizado | `configuracoes.html` |

Todos os endpoints de listagem suportam paginação (`page`, `pageSize`, resposta com `{ data, total, page, pageSize }`) e retornam erros no formato padrão `{ error: { code, message } }` (sem stack trace — RNF/`seguranca.md` item 5).

## 4. Mapa telas → dados/endpoints

| Tela | Papel | Principais endpoints consumidos |
|---|---|---|
| `login.html` | Comum | `POST /auth/login` |
| `recuperar-senha.html` | Comum | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| `home-socio.html` | Sócio | `GET /me/situacao`, `GET /me/proximo-baba`, `GET /situacao-geral` |
| `situacao-financeira.html` | Sócio | `GET /me/mensalidades` |
| `pagar-mensalidade.html` | Sócio | `GET /pix/payload`, `GET /me/mensalidades?month=` (polling/estado) |
| `meu-perfil.html` | Sócio | `GET /me/perfil`, `PATCH /me/perfil`, `GET /socios/:id/status-history` (sem observação DM) |
| `proximo-baba.html` | Sócio | `GET /me/proximo-baba`, `GET /babas` |
| `detalhe-baba.html` | Sócio | `GET /babas/:id`, `GET /babas/:id/eventos` |
| `rankings.html` | Sócio | `GET /rankings` |
| `prestacao-contas.html` | Sócio | `GET /prestacoes`, `GET /prestacoes/:month/pdf` |
| `dashboard-financeiro.html` | Diretor | `GET /dashboard/financeiro`, `GET /inadimplencia` |
| `socios-lista.html` | Diretor | `GET /socios` |
| `socio-form.html` | Diretor | `POST/PATCH /socios`, `PATCH /socios/:id/status`, `GET /socios/:id/status-history` |
| `convidados-lista.html` | Diretor | `GET /convidados` |
| `convidado-form.html` | Diretor | `POST/PATCH /convidados`, `POST /convidados/:id/remover-contato` |
| `lancamento-mensalidade.html` | Diretor | `GET /socios`, `POST /mensalidades` |
| `lancamento-convidado.html` | Diretor | `GET /convidados`, `POST /pagamentos-convidados` |
| `despesas.html` | Diretor | `GET/POST /despesas`, `GET /categorias/despesas` |
| `categorias.html` | Diretor | `GET/POST/PATCH /categorias/despesas`, `GET/POST/PATCH /categorias/receitas` |
| `prestacao-contas-geracao.html` | Diretor | `GET /prestacoes/:month/preview`, `POST /prestacoes`, `GET /prestacoes` |
| `inadimplencia.html` | Diretor | `GET /inadimplencia` |
| `baba-dia.html` | Diretor | `POST/GET/PATCH /babas`, `PUT /babas/:id/presenca` |
| `sorteio-times.html` | Diretor | `POST /babas/:id/sorteio`, `PUT /babas/:id/times` |
| `gols-cartoes.html` | Diretor | `GET/POST /babas/:id/eventos`, `DELETE /eventos/:id` |
| `suspensoes.html` | Diretor | `GET /suspensoes`, `POST /suspensoes/:id/liberar` |
| `configuracoes.html` | Diretor | `GET /config`, `PATCH /config/valores-padrao`, `PATCH /config/temporada`, `PATCH /config/pix` |

## 5. Estrutura de pastas

### 5.1 `backend/`

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                     # sócio-diretor inicial, categorias padrão, SystemConfig
├── src/
│   ├── server.ts                   # sobe o HTTP server (só isso)
│   ├── app.ts                      # Express, helmet, cors, rate limit, monta routes
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── me.routes.ts
│   │   ├── socios.routes.ts
│   │   ├── convidados.routes.ts
│   │   ├── mensalidades.routes.ts
│   │   ├── pagamentos-convidados.routes.ts
│   │   ├── despesas.routes.ts
│   │   ├── categorias.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── inadimplencia.routes.ts
│   │   ├── prestacoes.routes.ts
│   │   ├── pix.routes.ts
│   │   ├── babas.routes.ts
│   │   ├── suspensoes.routes.ts
│   │   ├── rankings.routes.ts
│   │   ├── config.routes.ts
│   │   └── webhooks.routes.ts       # inter-pix (desativado até ADR-05 virar realidade)
│   ├── controllers/                 # 1 por módulo acima — recebe req, valida Zod, chama service
│   ├── services/                    # regra de negócio pura — inclui balance.service.ts, suspension.service.ts, sorteio.service.ts, pdf.service.ts, pix.service.ts
│   ├── repositories/                # único ponto que importa o Prisma Client
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # valida JWT
│   │   ├── requireRole.middleware.ts# checa DIRETOR/SOCIO
│   │   ├── ownership.middleware.ts  # checa dono do recurso (evita IDOR)
│   │   ├── rateLimit.middleware.ts
│   │   ├── upload.middleware.ts     # multer + validação de tipo/tamanho
│   │   └── errorHandler.middleware.ts
│   ├── schemas/                     # Zod — 1 arquivo por módulo, espelha routes/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── supabaseStorage.ts       # upload/URL assinada em buckets privados
│   │   ├── pdf/                     # template HTML + Puppeteer (prestação de contas)
│   │   └── pix/
│   │       ├── PixGateway.ts        # interface (ADR-05)
│   │       ├── ManualPixGateway.ts  # implementação MVP (payload EMV estático)
│   │       └── InterPixGateway.ts   # stub para integração futura (desativado)
│   └── errors/
│       ├── AppError.ts
│       └── domain-errors.ts
├── .env.example
└── package.json
```

### 5.2 `frontend/`

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── recuperar-senha/page.tsx
│   ├── (socio)/                     # rotas protegidas por middleware.ts (role=SOCIO)
│   │   ├── inicio/page.tsx
│   │   ├── financeiro/page.tsx
│   │   ├── pagar/page.tsx
│   │   ├── perfil/page.tsx
│   │   ├── proximo-baba/page.tsx
│   │   ├── baba/[id]/page.tsx
│   │   ├── rankings/page.tsx
│   │   └── prestacao-contas/page.tsx
│   ├── (diretor)/                   # rotas protegidas por middleware.ts (role=DIRETOR)
│   │   ├── dashboard/page.tsx
│   │   ├── socios/page.tsx
│   │   ├── socios/novo/page.tsx
│   │   ├── socios/[id]/page.tsx
│   │   ├── convidados/page.tsx
│   │   ├── convidados/[id]/page.tsx
│   │   ├── lancamento-mensalidade/page.tsx
│   │   ├── lancamento-convidado/page.tsx
│   │   ├── despesas/page.tsx
│   │   ├── categorias/page.tsx
│   │   ├── prestacao-contas/page.tsx
│   │   ├── inadimplencia/page.tsx
│   │   ├── baba-dia/page.tsx
│   │   ├── baba-dia/[id]/sorteio/page.tsx
│   │   ├── baba-dia/[id]/eventos/page.tsx
│   │   ├── suspensoes/page.tsx
│   │   └── configuracoes/page.tsx
│   └── layout.tsx
├── features/
│   ├── auth/{components,hooks,services,schemas}
│   ├── socios/…
│   ├── convidados/…
│   ├── financeiro/…                 # mensalidades, despesas, categorias, saldo
│   ├── prestacao-contas/…
│   ├── pix/…
│   ├── baba/…                       # baba-dia, sorteio, eventos, suspensões
│   ├── rankings/…
│   └── configuracoes/…
├── components/ui/                   # Button, Card, Badge, Input, Table, Drawer, EmptyState… (design-system.md)
├── lib/
│   ├── api-client.ts                # fetch wrapper: injeta access token, refresh automático, trata erro padrão
│   ├── auth/                        # sessão (contexto), leitura de role
│   └── format.ts                    # moeda, data (pt-BR)
├── middleware.ts                    # protege (socio)/(diretor) por role, redireciona não-autenticado
├── .env.example
└── package.json
```

## 6. Decisões arquiteturais (ADRs)

### ADR-01 — Autenticação via JWT (access curto + refresh em cookie), não sessão em banco
**Contexto:** front e back são serviços separados (Vercel/Render). **Decisão:** login emite access token JWT (15 min) devolvido no corpo (guardado em memória no front) e refresh token (7 dias) em cookie `HttpOnly/Secure/SameSite=Strict`; rotação do refresh a cada uso. **Alternativas descartadas:** sessão em banco (Redis) — infraestrutura extra desnecessária para o volume (~50 sócios); JWT longo sem refresh — violaria "expiração curta" do baseline de segurança.

### ADR-02 — Status mensal do sócio com carry-forward calculado, sem job agendado
**Contexto:** todo mês precisa de um status (A/DM/I) para calcular cobrança e inadimplência, mas criar uma linha automaticamente todo mês via cron é frágil (Render hobby sem cron confiável) e opaco. **Decisão:** `SocioStatusMensal` guarda apenas os meses em que o diretor efetivamente definiu/alterou o status. O serviço `getStatusForMonth(socioId, month)` resolve assim: (1) existe registro exato → usa; (2) senão, usa o registro mais recente com `referenceMonth <= month` (carry-forward do último status conhecido); (3) senão (sócio novo, sem histórico), assume `A`. Isso mantém RNF8 (tudo derivado de lançamento, nunca campo solto) sem depender de execução agendada. **Alternativa descartada:** campo `status` direto em `Socio` (perderia histórico) e job diário para "fechar o mês" (ponto de falha silenciosa).

### ADR-03 — Saldo acumulado materializado em `MonthlyClosingBalance`, recalculado de forma incremental
**Contexto:** somar todo o histórico de receitas/despesas a cada leitura do dashboard degrada com o tempo (RNF3: dashboard < 2s). **Decisão:** cada mês fechado grava `revenueTotal`, `expenseTotal`, `monthBalance` e `cumulativeBalance` (= saldo do mês anterior + `monthBalance`) em `MonthlyClosingBalance`. Qualquer escrita financeira que afete o mês M (`SocioPayment`, `GuestPayment`, `OtherRevenue`, `Expense`) dispara `BalanceService.recalculateFrom(M)`, que recalcula M e propaga em cascata para todos os meses **posteriores** já existentes (o cálculo é O(meses futuros já registrados), não O(todo o histórico)). Leitura do dashboard é sempre um `SELECT` direto — nunca uma agregação de tudo. **Alternativa descartada:** calcular on-the-fly a cada request (simples de implementar, mas cresce linearmente com os meses e reprocessa toda vez); view materializada do Postgres com refresh manual (mais complexa de orquestrar do que um recálculo em cascata no service, e esconderia a lógica de negócio do Prisma/TS para dentro do SQL).

### ADR-04 — Suspensão por cartão vermelho como função de serviço pura sobre dado materializado, não job agendado
**Contexto:** RF30 exige que a suspensão bloqueie o jogador "a qualquer momento" que se tente escalá-lo no domingo seguinte — não pode depender de um cron rodar à meia-noite de sábado para "ativar" a suspensão. **Decisão:** ao registrar um `GameEvent` do tipo `CARTAO_VERMELHO`, o service já materializa uma linha em `Suspension` com `effectiveDate = dataDoCartão + 7 dias` (aproximação do "próximo domingo"; times jogam semanalmente). A pergunta "fulano está suspenso para o baba X?" é sempre respondida por `SuspensionService.isSuspended(participantId, targetBabaDate)`, que verifica: existe `Suspension` não liberada (`liftedAt IS NULL`) cujo `originEvent.babaDoDia` seja o baba **imediatamente anterior** (por data) ao baba alvo, para aquele sócio/convidado? Essa função é chamada tanto ao montar a lista de presença (`PUT /babas/:id/presenca`) quanto ao exibir `GET /me/proximo-baba` — nunca depende de um worker rodando em background. Override manual (`POST /suspensoes/:id/liberar`) apenas seta `liftedAt/liftedBy/liftReason`. **Alternativa descartada:** flag booleana `suspenso` no `Socio`, setada por cron — exatamente o padrão que o PRD pediu para evitar (dado deve ser sempre derivado de lançamento, RNF8, mesmo princípio do saldo/inadimplência).

### ADR-05 — Pix: gateway abstrato com implementação manual no MVP; Banco Inter fica pronto para plugar, não implementado agora
**Contexto:** o PRD deixou como pergunta em aberto (seção 10) a viabilidade de integração automática com a API Pix do Banco Inter (RF23), que depende de a associação ter conta PJ com API habilitada, certificado mTLS e `client_id`/`client_secret` — informação de negócio que a arquitetura, por si, não resolve. **Decisão:** desde o MVP, todo acesso a "gerar cobrança/QR Pix" passa por uma interface `PixGateway` (`generatePayload(amount, referenceMonth): { emvPayload, pixKey }`). A implementação ativa no MVP é `ManualPixGateway`: monta o payload BR Code/EMV estático a partir dos dados de `SystemConfig` (chave Pix, beneficiário, banco) — sem chamar serviço de terceiros (diferente do protótipo, que usa `api.qrserver.com` só para preview visual; no sistema real o QR é renderizado no frontend a partir do `emvPayload` retornado pelo backend, via lib `qrcode`). A confirmação do pagamento continua **sempre manual** pelo diretor (RF24), criando o registro em `SocioPayment`/`GuestPayment` — não existe "status pendente" no banco (ver seção 2.2). Um endpoint `POST /api/webhooks/inter-pix` já existe no roteamento, mas fica **desativado** (`SystemConfig.interIntegrationEnabled = false`, sem credenciais configuradas) até a associação confirmar viabilidade de conta PJ Inter com API. Quando/se isso acontecer, basta: (1) implementar `InterPixGateway implements PixGateway` (cobrança dinâmica + validação de assinatura do webhook), (2) configurar `INTER_CLIENT_ID`/`INTER_CLIENT_SECRET`/`INTER_CERT_PATH` como variáveis de ambiente no Render (nunca no banco/código, RSP8), (3) ligar `interIntegrationEnabled=true`. Nenhuma mudança de schema, controller ou tela de sócio é necessária — só a troca da implementação injetada no service. **Pergunta que fica em aberto para o usuário/negócio (não bloqueante para o desenvolvimento do MVP):** a Associação Kalibaba já possui conta PJ no Banco Inter com API Pix habilitada? Essa resposta só define **quando** o ADR-05 evolui para a Fase 2 — o MVP roda inteiramente no caminho manual.

### ADR-06 — PDF da Prestação de Contas gerado com Puppeteer + template HTML/Tailwind
**Contexto:** RF19 exige PDF mensal fiel à identidade visual do sistema (navy/teal, Poppins/Inter — decisão já registrada em `docs/design-system.md`), gerado no backend. **Decisão:** usar **Puppeteer** (Chromium headless) renderizando um template HTML server-side (reaproveitando as mesmas classes utilitárias do design system) e exportando para PDF. O arquivo gerado é enviado ao bucket privado `relatorios-pdf` do Supabase Storage; `AccountabilityReport.pdfPath` guarda a referência, e o download é sempre via URL assinada de curta duração (nunca bucket público). **Alternativas descartadas:** `PDFKit` (desenho manual em baixo nível — replicar layout com grid/cards do design system seria caro e frágil de manter); `react-pdf` (bom encapsulamento em React, mas exige reescrever o template em componentes próprios do `@react-pdf/renderer`, sem reuso direto do HTML/Tailwind já validado no protótipo). **Risco assumido:** Chromium headless consome mais memória — mitigação e trade-off documentados na seção 8.

### ADR-07 — Upload de comprovantes em Supabase Storage, bucket privado, URL assinada
**Contexto:** RSP5 exige que anexos de despesa (podem conter PII de terceiros) fiquem restritos ao diretor, sem indexação pública. **Decisão:** bucket `comprovantes` (privado) no Supabase Storage; upload via backend (multer → buffer → Supabase Storage SDK, nunca upload direto do browser com chave pública); leitura sempre via `GET /despesas/:id/anexo`, que gera URL assinada de curta duração após checar que o requisitante é diretor. Mesmo padrão para o bucket `relatorios-pdf` (ADR-06), mas esse é acessível também a sócios (RF20).

### ADR-08 — `/me/*` para autoatendimento do sócio, evitando IDOR por construção
**Contexto:** RSP1/RSP3 proíbem que um sócio acesse dados financeiros de outro via manipulação de ID na URL. **Decisão:** todas as telas do sócio sobre **seus próprios dados** (situação financeira, perfil, próximo baba) usam rotas `/api/me/...` que resolvem o `socioId` a partir do JWT — nunca recebem um `:id` de sócio no path. Rotas que recebem `:id` (ex.: `GET /socios/:id`) exigem papel `DIRETOR` **ou** que `:id === req.user.socioId`, checado em middleware (`ownership.middleware.ts`), nunca só no controller. Isso não elimina a necessidade de checagem de autorização no backend (ainda existe, defesa em profundidade), mas remove a classe de erro mais comum (esquecer o check em uma rota nova).

## 7. Modelo de ameaças (resumo)

| Ator / superfície | Ameaça | Mitigação |
|---|---|---|
| Sócio autenticado | IDOR — tentar ler mensalidade/observação DM de outro sócio trocando `:id` na URL | Rotas de autoatendimento usam `/me/*` (ADR-08); rotas com `:id` passam por `ownership.middleware.ts`; testes de integração cobrem autorização negada (`convencoes.md`) |
| Sócio autenticado | Ver quem está inadimplente na associação (dado de outros) | `GET /situacao-geral` retorna só agregados; `GET /inadimplencia` (nominal) é exclusivo do diretor |
| Sócio/diretor | Ver observação clínica (DM) de outro sócio | Campo `observation` de `SocioStatusMensal` só é serializado na resposta quando `req.user.role === DIRETOR` (serializer dedicado, nunca `select *`) |
| Qualquer usuário autenticado | XSS via campos de texto livre (descrição de despesa, observação DM, nome de convidado) | Sanitização/escape na renderização (React já escapa por padrão), Content-Security-Policy via helmet, nunca `dangerouslySetInnerHTML` com dado de usuário |
| Atacante externo | Força bruta no login / reset de senha | Rate limiting reforçado em `/auth/*`, mensagens de erro sem enumeração de usuário, bcrypt/argon2 no hash |
| Atacante externo | Acesso direto a comprovante/PDF via URL adivinhada | Buckets privados, URLs assinadas de curta duração, nunca path previsível público |
| Atacante externo | Upload de arquivo malicioso como "comprovante" | `upload.middleware.ts` valida mimetype real (não só extensão) e tamanho (≤5MB), armazenamento fora do diretório servido como estático |
| Diretor (uso indevido/erro) | Lançamento incorreto ou apagado sem rastro | `AuditLog` em toda escrita financeira e de status (RNF5/RSP9); nenhum `DELETE` físico em `SocioPayment`/`GameEvent` sem trilha (usar soft-delete ou log explícito conforme refinamento na fase `/desenvolver`) |
| Integração futura Inter (ADR-05) | Webhook falso confirmando pagamento não recebido | Endpoint desativado por padrão; quando ativado, exige validação de assinatura/mTLS antes de qualquer escrita; nunca confia em payload não autenticado |
| Qualquer client | CSRF em ações de escrita (ex.: confirmar pagamento) | Cookie de refresh `SameSite=Strict`; mutações de dado usam o access token no header `Authorization` (não cookie), reduzindo superfície CSRF a zero nas rotas de negócio |
| Infra | Vazamento de `SUPABASE_SERVICE_ROLE_KEY` ou segredos Inter | Nunca no frontend; só `process.env` no backend (Render); `.env` no `.gitignore`; rotação imediata se vazar (`docs/seguranca.md` item 1) |

## 8. Riscos e trade-offs

- **Puppeteer no Render (ADR-06):** Chromium headless é pesado em memória; planos hobby/free do Render podem sofrer OOM ao gerar PDF sob carga simultânea. Mitigação: gerar PDF de forma assíncrona/enfileirada (mesmo que in-process, sem bloquear outras requisições) e monitorar; se o plano contratado não suportar, plano B é migrar para `@react-pdf/renderer` (mais leve, porém exige reescrever o template).
- **Recalcular saldo em cascata (ADR-03):** editar/lançar um registro em um mês muito antigo (ex.: corrigir uma despesa de 8 meses atrás) recalcula todos os meses seguintes já fechados — ainda barato para o volume da associação (dezenas de meses), mas cresce se o histórico ficar muito longo; aceitável para o MVP.
- **`effectiveDate = data do cartão + 7 dias` (ADR-04):** assume jogos semanais aos domingos sem falha. Se um domingo for cancelado (feriado, chuva) sem registro de `BabaDoDia`, a suspensão "aguarda" o próximo baba criado, o que já é o comportamento correto (suspende para o próximo baba real, não para uma data de calendário fixa) — mas exige que o diretor sempre crie o registro do baba, mesmo os cancelados, se quiser que o sistema "pule" a suspensão corretamente; documentar esse cuidado operacional na doc de usuário.
- **Um único diretor no MVP:** RBAC modelado para múltiplos usuários com `role=DIRETOR`, mas o fluxo de negócio (PRD) assume um diretor único hoje. Não há tela de gestão de outros diretores no inventário de telas — se isso for necessário no futuro, precisa de nova tela + endpoint (fora do escopo atual).
- **Prisma + Supabase (pooling):** Render (long-running Node) + Supabase Postgres exige `DATABASE_URL` via PgBouncer (porta 6543, `pgbouncer=true`) para a aplicação e `DIRECT_URL` (porta 5432) só para migrations — já refletido no `datasource` do schema; erro comum é usar a mesma URL para os dois.
- **Ausência de notificação automática (fora do MVP):** cobrança e aviso de inadimplência continuam manuais/verbais; o sistema não envia e-mail/WhatsApp — risco de produto, não técnico, já sinalizado no PRD.
- **Integração Inter (ADR-05) é só andaime:** nenhum ganho real de automação existe até a associação confirmar a conta PJ/API — enquanto isso, 100% do fluxo de confirmação é manual, então o gargalo operacional (diretor confirmar pagamentos um a um) permanece no MVP.

## 9. Variáveis de ambiente novas (`.env.example`)

### `backend/.env.example`
```
DATABASE_URL=
DIRECT_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
COOKIE_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET_COMPROVANTES=
SUPABASE_STORAGE_BUCKET_RELATORIOS=
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=
FRONTEND_URL=
CORS_ALLOWED_ORIGINS=
RATE_LIMIT_WINDOW_MS=
RATE_LIMIT_MAX=
PIX_INTEGRATION_MODE=
INTER_CLIENT_ID=
INTER_CLIENT_SECRET=
INTER_CERT_PATH=
INTER_WEBHOOK_SECRET=
```

### `frontend/.env.example`
```
NEXT_PUBLIC_API_URL=
```

Nenhum valor real deve ser preenchido nesses arquivos — apenas as chaves, conforme `docs/seguranca.md`.

## 10. Próximos passos

Arquitetura concluída e pronta para a fase de desenvolvimento. Recomenda-se rodar **`/desenvolver`** para que o Dev Sênior implemente `backend/`, `frontend/` e `database/` com fidelidade a este documento e ao `docs/design-system.md`.
