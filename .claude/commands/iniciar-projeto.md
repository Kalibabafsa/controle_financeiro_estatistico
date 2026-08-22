---
description: Inicializa um projeto novo a partir do template — pergunta stack/banco/GitHub, preenche a config e ativa o git hook.
---

Você está iniciando um projeto novo a partir da estrutura base. Conduza a inicialização fazendo **uma pergunta por vez** e só então preencha os arquivos.

Colete, na ordem:
1. **Nome do projeto** e uma descrição de uma linha.
2. **Tipo** (app web, API, sistema interno, landing, etc.).
3. **Qual banco de dados usar** — apresente as opções e peça para escolher UMA:
   - SQL Server
   - MySQL
   - PostgreSQL
   - Supabase (Postgres gerenciado)
   - MongoDB
4. **Repositório GitHub** (`usuario/repo`) — se ainda não existe, ofereça criar com `gh repo create`.
5. **Destinos de deploy** (frontend, backend, banco) — sugira defaults mas confirme.

Depois de coletar tudo:
- Preencha **todos os placeholders `{{...}}`** em `project.config.md` e `CLAUDE.md`.
- Ajuste o `ORM_DRIVER` conforme o banco (Prisma para SQL/Postgres/Supabase/MySQL/SQLServer; para MongoDB, Prisma Mongo ou Mongoose).
- Atualize o `.env.example` com a `DATABASE_URL` no formato do banco escolhido.
- Inicialize o git se necessário (`git init`, branch `main`) — sem commitar `.env`.
- **Ative o git hook de documentação do banco:** `git config core.hooksPath githooks` (e `chmod +x githooks/pre-commit` no Linux/macOS).
- NÃO gere código ainda. Ao final, mostre um resumo e recomende rodar `/planejar`.

Fluxo do projeto: `/planejar` → `/prototipar` → `/arquitetar` → `/desenvolver` → `/revisar` → `/seguranca` → `/testar` → `/deploy`.

Regras: nada de segredo em arquivo versionado; confirme cada decisão importante antes de gravar.
