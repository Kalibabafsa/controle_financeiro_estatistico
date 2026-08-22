# Documentação do Banco

Sistema de documentação **versionada** do schema. Regras:

- **`current.md`** — estado atual do banco. É a fonte da verdade. Leia sempre este arquivo primeiro.
- **`history/`** — snapshots do passado. Sempre que o schema muda, o `current.md` de antes é copiado para cá como `schema-vNNN-YYYY-MM-DD.md`, **antes** de o `current.md` ser reescrito. Assim nunca se perde histórico.
- **`CHANGELOG.md`** — o que mudou, quando, por quê e qual migration.

## Quando atualiza

Sempre que houver mudança de schema (nova tabela, coluna, índice, enum, relacionamento), rode `/documentar-banco`. O agente `documentador`:
1. Lê o `schema.prisma` e as migrations mais recentes.
2. Arquiva o `current.md` atual em `history/` com a versão anterior.
3. Reescreve o `current.md` com o novo estado (tabelas, colunas, tipos, relações, índices, RLS).
4. Adiciona uma entrada no `CHANGELOG.md`.

Isso mantém a documentação do banco sempre fiel, com rastro completo de como ele evoluiu.
