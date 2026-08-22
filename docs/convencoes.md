# Convenções de Código

Padrões que todos os agentes seguem. O objetivo é organização de time sênior, com front, back e banco bem separados.

## Gerais

- **Idioma:** código, nomes de variáveis, funções e arquivos em **inglês**; comentários e documentação em **PT-BR**.
- **TypeScript estrito:** `strict: true`, sem `any` solto (use `unknown` + narrowing quando necessário).
- **Validação:** **Zod** em toda fronteira de entrada (payload de API, params, query, formulários).
- **Segurança:** siga `docs/seguranca.md`. Nenhum segredo em código ou arquivo versionado — só `process.env.*`, documentado no `.env.example`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Nunca `git add -A`; adicione arquivos específicos. Use `/git`.

## Frontend (`frontend/`) — Next + React + TS + Tailwind + Zod

- **Organização por feature:** `app/` (rotas) + `features/<feature>/` (componentes, hooks, services) + `components/ui/` (compartilhados).
- **Estilização só com Tailwind.** Sem CSS inline mágico, sem valores hardcoded fora do tema.
- **Camada de acesso à API isolada** em `lib/` ou `services/` — nada de `fetch` cru espalhado.
- **Client Components só onde necessário** (interatividade, estado). O resto é Server Component.
- **Schemas Zod** de formulário compartilhados com o backend quando o contrato for o mesmo.
- Nunca confie no client para autorização: o front esconde, o back decide.

## Backend (`backend/`) — Node + Express + TS + Prisma, em camadas

```
backend/src/
├── server.ts                 ← sobe o HTTP server (só isso)
├── app.ts                    ← Express, middlewares globais, monta rotas
├── routes/                   ← define rotas e liga na controller
├── controllers/              ← recebe req, valida (Zod), chama service, responde
├── services/                 ← REGRA DE NEGÓCIO pura (não conhece req/res)
├── repositories/             ← ÚNICA camada que fala com o Prisma/banco
├── middlewares/              ← auth, erro, rate limit, etc.
├── schemas/                  ← schemas Zod
├── lib/                      ← prisma client, helpers
└── errors/                   ← erros de domínio + handler central
```

Regras de camada (não negociáveis):
- **Controller** não contém regra de negócio nem acessa banco.
- **Service** não conhece `req`/`res`; recebe dados já validados, devolve dados/erros de domínio.
- **Repository** é o único a importar o Prisma. Troca de banco impacta só aqui.
- **Erros** tratados por um middleware central; nunca vaze stack trace ou dado sensível.
- Toda rota protegida passa por middleware de **autorização**.

## Banco (`database/`)

- **Migrations versionadas** (Prisma migrate). O schema é a fonte da verdade do modelo de dados.
- `seed` separado para dados iniciais.
- Connection string só via `DATABASE_URL` no `.env`.
- O banco concreto vem de `project.config.md`; a camada de repository isola o resto do código dessa escolha.

## Testes

- **Unitários:** services e funções puras.
- **Integração:** endpoints da API contra banco de teste (incluindo casos de autorização negada).
- **E2e:** fluxos críticos do usuário (Playwright).
- Testes determinísticos: sem depender de rede real, relógio ou ordem de execução.
