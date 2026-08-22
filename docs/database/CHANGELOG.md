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

## v000 — {{DATA}}
- Estado inicial (sem tabelas ainda).
