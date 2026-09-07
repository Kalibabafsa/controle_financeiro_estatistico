# Changelog do Banco de Dados

> Histórico cronológico de toda alteração de schema. O mais recente no topo. Cada entrada aponta para o snapshot arquivado em `history/` e para a migration.

<!-- Modelo de entrada:

## v001 — YYYY-MM-DD
- **Migration:** `database/prisma/migrations/<nome>`
- **Mudança:** criou tabela `users` (id, email, password_hash, created_at).
- **Motivo:** autenticação (RF3).
- **Impacto:** repository de usuários; nenhuma quebra de contrato de API.
- **Snapshot anterior:** `history/schema-v000-YYYY-MM-DD.md`
-->

## v002 — 2026-09-06
- **Migration:** ainda não aplicada (mesma situação de v001 — aguardando `DATABASE_URL`/`DIRECT_URL` reais do Supabase).
- **Mudança:** adicionado `onDelete: Cascade` em três relações obrigatórias que estavam sem ação de deleção explícita (default Postgres/Prisma = RESTRICT): `TeamMember.presenca`, `GameEvent.presenca` e `Suspension.originEvent`.
- **Motivo:** correção do bug 🔴 #1 do `docs/planning/code-review.md` (reconfirmado como B3 em `docs/planning/security-report.md`): `PUT /api/babas/:id/presenca` quebrava com erro 500 (violação de FK P2003) sempre que o diretor reeditava a lista de presença de um baba que já tinha sorteio de times ou gols/cartões lançados, porque `presencasRepository.replaceAll` apagava e recriava as presenças sem que o schema permitisse cascata.
- **Impacto:** `backend/src/repositories/presencas.repository.ts` (`replaceAll`) passou a apagar explicitamente, na mesma transação e na ordem correta (`Suspension` → `GameEvent`/`TeamMember` → `Presenca`), os vínculos das presenças substituídas antes de recriá-las — o cascade do schema é defesa em profundidade, não a única linha de defesa. `presenca.service.ts` (`setPresenca`) passou a registrar em `AuditLog` sempre que essa substituição de fato remove times/eventos já lançados (ação `presenca.replace_com_perda_de_dados`), para nunca perder rastro de um lançamento apagado (RNF5/RNF8). Nenhuma coluna nova, nenhuma tabela nova — só ação de deleção nas 3 relações citadas.
- **Snapshot anterior:** `history/schema-v001-2026-09-04.md`

## v001 — 2026-09-04
- **Migration:** ainda não aplicada (schema definido, aguardando `DATABASE_URL`/`DIRECT_URL` reais do Supabase para `npx prisma migrate dev --name init` — ver nota em `current.md`).
- **Mudança:** schema completo inicial do Sistema Kalibaba criado em `backend/prisma/schema.prisma`: autenticação (`User`, `PasswordResetToken`), associados (`Socio`, `SocioStatusMensal`), convidados (`Convidado`), financeiro (`SocioPayment`, `GuestPayment`, `RevenueCategory`, `OtherRevenue`, `ExpenseCategory`, `Expense`, `MonthlyClosingBalance`, `AccountabilityReport`), futebol (`BabaDoDia`, `Presenca`, `Team`, `TeamMember`, `GameEvent`, `Suspension`), configuração/auditoria (`SystemConfig`, `AuditLog`) e enums (`Role`, `MemberStatus`, `PaymentMethod`, `ParticipantType`, `PlayerPosition`, `EventType`).
- **Motivo:** implementação da fase `/desenvolver` a partir de `docs/planning/architecture.md` (RF1–RF37, ADR-01 a ADR-08).
- **Impacto:** todas as camadas de repository do backend (`backend/src/repositories/`) passam a operar sobre este schema; nenhuma API pública existia antes, então não há quebra de contrato.
- **Snapshot anterior:** `history/schema-v000-2026-08-08.md`

## v000 — 2026-08-08
- Estado inicial (sem tabelas ainda).
