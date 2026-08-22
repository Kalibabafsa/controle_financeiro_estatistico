---
description: Atualiza a documentação do banco — arquiva o estado anterior e regenera o estado atual + changelog.
---

Use o subagente **documentador** para atualizar a documentação do banco de dados.

Ele deve, seguindo `docs/database/README.md`:
1. Ler o `schema.prisma` e as migrations recentes (use `git diff` para ver o que mudou).
2. Arquivar o `docs/database/current.md` atual em `docs/database/history/schema-vNNN-YYYY-MM-DD.md` (a versão que estava valendo).
3. Reescrever `docs/database/current.md` com o novo estado (tabelas, colunas, tipos, relações, índices, enums, RLS) e incrementar a versão.
4. Adicionar entrada no topo de `docs/database/CHANGELOG.md` (versão, data, migration, o que mudou, motivo, impacto, link para o snapshot).
5. Atualizar a versão do banco em `docs/memory/MEMORY.md`.

Rode isto sempre que o schema mudar. Nunca documente segredos.
