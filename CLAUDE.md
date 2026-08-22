# Sistema Kalibaba

> Sistema de controle financeiro e esportivo da Associação Kalibaba (futebol de 7) — associados, mensalidades, módulo de baba (times, gols, cartões) e contas a receber via Pix/QR Code.

Este projeto foi iniciado a partir da **Estrutura Base — Desenvolvimento com Agentes Seniores**. A configuração completa está em [`project.config.md`](project.config.md). Leia-o antes de qualquer trabalho.

## Como trabalhamos

O desenvolvimento segue um fluxo profissional executado por 7 agentes seniores, um por fase. Cada fase tem um comando:

| Ordem | Comando | Agente | Entrega |
|---|---|---|---|
| 1 | `/planejar` | Analista/PO | PRD + mapa funcional + inventário de telas em `docs/planning/prd.md` |
| 2 | `/prototipar` | UX/Design | Telas em HTML em `prototipo/` + `docs/design-system.md` |
| 3 | `/arquitetar` | Arquiteto | Arquitetura em `docs/planning/architecture.md` |
| 4 | `/desenvolver` | Dev Sênior | Código fiel ao protótipo em `frontend/`, `backend/`, `database/` |
| 5 | `/revisar` | Code Reviewer | Revisão em `docs/planning/code-review.md` |
| 6 | `/seguranca` | Eng. de Segurança | Auditoria em `docs/planning/security-report.md` |
| 7 | `/testar` | QA/Tester | Testes + `docs/planning/qa-report.md` |
| 8 | `/deploy` | DevOps/Deploy | Ambiente publicado |

Agente de apoio: **`documentador`** (documentação viva + memória). O `/prototipar` cria os protótipos HTML de todas as telas ANTES de codar, e o sistema real deve ficar **idêntico** a eles.

Comandos de apoio: `/git` (commits e push), `/retomar` (início de dia), `/encerrar-dia` (fim de dia), `/documentar-banco` (atualiza doc do schema). Fluxo detalhado em [`docs/workflow.md`](docs/workflow.md). Padrões em [`docs/convencoes.md`](docs/convencoes.md). Baseline de segurança em [`docs/seguranca.md`](docs/seguranca.md). Autonomia e auto-correção em [`docs/autonomia.md`](docs/autonomia.md).

## Memória, documentação e autonomia

- **Início de sessão:** rode `/retomar`. O sistema lê só `docs/memory/MEMORY.md`, `PROXIMOS-PASSOS.md` e a última sessão — barato em tokens — e resume onde paramos e o que vem a seguir.
- **Fim de sessão:** rode `/encerrar-dia`. O agente `documentador` grava `docs/memory/sessions/YYYY-MM-DD.md` com tudo que foi feito, decisões e próximas demandas, e atualiza o índice. Assim, projetos de vários dias nunca perdem o fio.
- **Documentação viva:** o `documentador` mantém a doc fiel ao código. O banco é documentado em `docs/database/current.md` (estado atual) com histórico versionado em `docs/database/history/` e `CHANGELOG.md` — a cada mudança de schema, o estado anterior é arquivado e um novo é gerado (`/documentar-banco`).
- **Autônomo e auto-corretivo:** aprovada a demanda, os agentes seguem o fluxo sozinhos e, ao encontrar um erro, diagnosticam e corrigem (até 3 tentativas) antes de pedir ajuda. Regras em `docs/autonomia.md`.

## Stack

- **Frontend** (`frontend/`): Next.js + React + TypeScript + Tailwind CSS + Zod
- **Backend** (`backend/`): Node.js + Express + TypeScript + Prisma, em camadas (`server → app → router → controller → service → repository`)
- **Banco** (`database/`): Supabase (Postgres gerenciado)

Front, back e banco são **separados**. Cada camada tem responsabilidade única e não vaza para as outras.

## Regras de Ouro

1. **Sempre leia `project.config.md` primeiro.** É a fonte da verdade do projeto.
2. **Um agente por fase.** Não pule fases; cada uma depende do artefato da anterior.
3. **Segurança é prioridade máxima.** Todo código segue `docs/seguranca.md`. O deploy é bloqueado por achado crítico de segurança.
4. **Zod valida toda entrada** — no frontend (formulários) e no backend (payloads, params, query).
5. **Arquitetura em camadas no backend, sem atalhos:** controller nunca fala com o banco direto; sempre via service → repository.
6. **Zero segredo versionado.** Nada de token, senha ou connection string em código ou commit. Use `.env` (ignorado) e variáveis no deploy.
7. **Código em inglês, conversa e docs em PT-BR.** Respostas curtas e diretas.
8. **Testes e segurança antes do deploy.** `/deploy` só roda após `/seguranca` e `/testar` aprovarem.
9. **Git com disciplina:** Conventional Commits; nunca `git add -A`/`git add .`.
10. **Documentação nunca fica velha.** Toda mudança relevante (código, banco, decisão) é refletida na doc pelo `documentador`. Banco alterado → `/documentar-banco`.
11. **Memória em dia.** Comece com `/retomar`, termine com `/encerrar-dia`. Mantenha `MEMORY.md` curto.
12. **Autonomia com limites.** Siga o fluxo e corrija erros sozinho; pare só para decisões de negócio ou ações destrutivas (ver `docs/autonomia.md`).
13. **Fidelidade ao protótipo.** O sistema real deve ser idêntico aos HTMLs de `prototipo/` e ao `docs/design-system.md`. Reviewer e QA checam isso.
14. **Auto-doc do banco.** Mudou schema → a tarefa não termina sem atualizar `docs/database/` (`/documentar-banco`). O git hook trava o commit se esquecer.

## Estrutura de pastas

```
Sistema Kalibaba/
├── CLAUDE.md · project.config.md · README.md · .gitignore · .env.example
├── .github/            ← CI + template de PR
├── .claude/            ← agentes + comandos
├── githooks/           ← pre-commit (trava commit se schema mudar sem doc)
├── docs/               ← workflow, convenções, segurança, autonomia, design-system
│   ├── planning/       ← PRD, arquitetura, review, segurança, QA
│   ├── database/       ← current.md + history/ + CHANGELOG (banco versionado)
│   └── memory/         ← MEMORY.md + PROXIMOS-PASSOS + sessions/ (memória diária)
├── prototipo/          ← telas em HTML (fonte de fidelidade visual)
├── frontend/           ← Next + React + TS + Tailwind + Zod
├── backend/            ← Node + Express + TS + Prisma (camadas)
└── database/           ← migrations / schema / seeds
```
