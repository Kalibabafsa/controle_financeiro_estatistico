# Configuração do Projeto

> Preenchido pelo comando `/iniciar-projeto`. É a **fonte da verdade** sobre o projeto — todos os agentes leem este arquivo antes de agir.

## Identidade

- **Nome do projeto:** Sistema Kalibaba
- **Descrição (uma linha):** Sistema de controle financeiro e esportivo da Associação Kalibaba (futebol de 7) — associados, mensalidades, módulo de baba (times, gols, cartões) e contas a receber via Pix/QR Code.
- **Tipo:** App web público
- **Idioma de comunicação:** Português (PT-BR)
- **Data de início:** 2026-08-08

## Repositório (GitHub)

- **Repositório:** Kalibabafsa/controle_financeiro_estatistico  <!-- criar manualmente no GitHub se ainda não existir -->
- **Branch principal:** main
- **Branch de trabalho:** develop
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) — typecheck, lint, testes, build, varredura de segredos.

## Stack

### Frontend
- Next.js + React + TypeScript
- Tailwind CSS (estilos) + Zod (validação)
- Pasta: `frontend/`

### Backend
- Node.js + Express + TypeScript
- Prisma (ORM)
- Arquitetura em camadas: `server.ts → app.ts → routes → controllers → services → repositories`
- Pasta: `backend/`

### Banco de dados
- **Escolhido:** Supabase (Postgres gerenciado)
- Pasta: `database/`
- ORM/driver: Prisma (provider `postgresql`, apontando para a connection string do Supabase)

## Deploy

- **Frontend:** Vercel
- **Backend:** Render
- **Banco:** Supabase (gerenciado, já hospedado)

## Convenções ativas

- Código, nomes de variáveis e funções em **inglês**; comentários e docs em **PT-BR**.
- Validação com **Zod** em toda entrada (front e back).
- Segurança conforme `docs/seguranca.md` (obrigatório).
- Nenhum segredo versionado (ver `.gitignore`).
- Padrões detalhados em [`docs/convencoes.md`](docs/convencoes.md).

## Estado do fluxo

<!-- Os agentes atualizam esta seção conforme avançam. -->

| Fase | Comando | Status | Artefato |
|---|---|---|---|
| Planejamento | `/planejar` | concluído | `docs/planning/prd.md` (mapa funcional + inventário de telas) |
| Prototipagem | `/prototipar` | concluído | `prototipo/*.html` (26 telas) + `docs/design-system.md` |
| Arquitetura | `/arquitetar` | concluído | `docs/planning/architecture.md` (schema Prisma, contratos de API, ADRs) |
| Desenvolvimento | `/desenvolver` | concluído (v1) | backend completo (56 endpoints, camadas, schema v001) + frontend completo (26 telas) em `frontend/`, `backend/` — ver `docs/database/current.md` |
| Revisão | `/revisar` | pendente | `docs/planning/code-review.md` |
| Segurança | `/seguranca` | pendente | `docs/planning/security-report.md` |
| QA | `/testar` | pendente | `docs/planning/qa-report.md` |
| Deploy | `/deploy` | pendente | ambiente publicado |
