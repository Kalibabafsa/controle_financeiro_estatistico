---
name: estrutura-base
description: Explica e conduz o fluxo completo da Estrutura Base — Desenvolvimento com Agentes Seniores (8 agentes + documentador, comandos /planejar até /deploy, memória, segurança e fidelidade ao protótipo). Use quando o usuário perguntar como usar este template, pedir para iniciar um projeto novo a partir dele, ou precisar de orientação sobre a ordem/finalidade dos comandos do fluxo.
---

# Estrutura Base — Desenvolvimento com Agentes Seniores

Estrutura **reutilizável** para iniciar qualquer projeto com um fluxo profissional de desenvolvimento executado por agentes de IA (Claude Code), com **GitHub** e **segurança** integrados desde o início. Você **clona esta pasta**, roda `/iniciar-projeto` e a estrutura se molda ao projeto novo — mantendo esta base intacta para o próximo.

## Como usar

1. **Copie esta pasta** com um novo nome (ex.: `meu-projeto/`). Nunca trabalhe direto no template original.
2. **Renomeie `claude-config/` para `.claude/`** dentro da cópia. Se já existir uma pasta `.claude/` antiga na cópia, **apague-a antes** — a config válida é sempre a de `claude-config/`. (O template guarda a config como `claude-config/` porque pastas `.claude` são protegidas fora do Claude Code; o Claude Code só reconhece os agentes/comandos depois do rename.)
3. Abra a cópia no Claude Code.
4. Rode **`/iniciar-projeto`**. Ele pergunta nome, tipo, **qual banco** usar e o **repositório GitHub**, e preenche a configuração.
5. Siga o fluxo dos comandos, na ordem abaixo.

## O fluxo (8 agentes seniores + documentador de apoio)

```
/planejar     → Analista/PO        → PRD + mapa funcional + inventário de telas (conversando)
/prototipar   → UX/Design          → todas as telas em HTML + design system (antes de codar)
/arquitetar   → Arquiteto          → decisões técnicas + estrutura de pastas
/desenvolver  → Dev Sênior         → implementação FIEL ao protótipo (frontend / backend / banco)
/revisar      → Code Reviewer      → revisão adversarial + fidelidade ao protótipo
/seguranca    → Eng. de Segurança  → auditoria de segurança (bloqueia se crítico)
/testar       → QA/Tester          → testes (unit / integração / e2e) + aceite + fidelidade
/deploy       → DevOps/Deploy      → build, checagens e publicação
```

Comandos de apoio:
- **`/git`** — commits e push seguindo Conventional Commits, sem versionar segredos.
- **`/retomar`** — início de dia: lê a memória (barato em tokens) e diz onde paramos.
- **`/encerrar-dia`** — fim de dia: documenta tudo que foi feito e prepara a memória para amanhã.
- **`/documentar-banco`** — atualiza a doc do schema (versionada) quando o banco muda.

Detalhes completos em [`docs/workflow.md`](../../../docs/workflow.md).

## Estrutura

```
estrutura-base/
├── README.md                  ← este arquivo
├── CLAUDE.md                  ← instruções do projeto (com placeholders)
├── project.config.md          ← configuração do projeto (stack + banco + repo)
├── .gitignore                 ← nunca versionar segredos
├── .env.example                ← modelo de variáveis de ambiente
├── .github/
│   ├── workflows/ci.yml       ← CI: typecheck, lint, testes, build, varredura de segredos
│   └── pull_request_template.md
├── claude-config/  → renomeie para .claude/ ao clonar
│   ├── settings.json          ← permissões (SEM segredos hardcoded)
│   ├── agents/                ← 8 agentes de fluxo + documentador (apoio)
│   └── commands/               ← comandos (/planejar /prototipar.../deploy + /git /retomar /encerrar-dia /documentar-banco)
├── githooks/                  ← pre-commit: trava commit se schema mudar sem doc
├── docs/
│   ├── workflow.md            ← o fluxo completo explicado
│   ├── convencoes.md          ← padrões de código front + back
│   ├── seguranca.md           ← baseline de segurança obrigatório
│   ├── autonomia.md           ← execução autônoma + auto-correção de erros
│   ├── design-system.md       ← padrões visuais extraídos do protótipo
│   ├── planning/               ← PRDs, arquitetura, review, segurança, QA (gerados pelo fluxo)
│   ├── database/               ← current.md + history/ + CHANGELOG (banco versionado)
│   └── memory/                 ← MEMORY.md + PROXIMOS-PASSOS + sessions/ (memória diária)
├── prototipo/                  ← telas em HTML (fonte de fidelidade visual)
├── frontend/                   ← Next + React + TS + Tailwind + Zod
├── backend/                    ← Node + Express + TS + Prisma (camadas)
└── database/                   ← migrations / schema / seeds
```

## Stack padrão

- **Frontend:** Next.js + React + TypeScript + Tailwind CSS + Zod
- **Backend:** Node.js + Express + TypeScript + Prisma, arquitetura em camadas (`server → app → router → controller → service → repository`)
- **Banco:** escolhido no início (SQL Server, MySQL, Postgres, Supabase ou MongoDB)

> Front, back e banco ficam **separados** em pastas próprias. Se preferir, cada um pode virar um repositório independente.

## GitHub

O template já vem com CI (GitHub Actions) que roda a cada push/PR: checagem de tipos, lint, testes, build e **varredura de segredos** (Gitleaks). O comando `/git` cuida de commits e push com boas práticas. O `/iniciar-projeto` registra o repositório em `project.config.md`.

## Design-first: protótipo antes do código

Antes de escrever o sistema real, o agente de **UX/Design** (`/prototipar`) cria **todas as telas em HTML** na pasta `prototipo/`. Ele pergunta se você tem referência (texto ou imagem); se não tiver, te entrevista (cores, botões, tipografia) e cria o design do zero, tela por tela. Só depois de tudo aprovado ele extrai os padrões para `docs/design-system.md`. O sistema real é construído **idêntico** a esses protótipos — o que elimina retrabalho de design lá na frente.

## Inteligente: documenta, lembra e se autocorrige

- **Documentação viva:** o agente `documentador` mantém a doc fiel ao código. O banco fica em `docs/database/current.md` com histórico versionado — a cada mudança de schema, o estado anterior vai para `history/` e um novo é gerado, com entrada no `CHANGELOG.md`.
- **Memória entre dias:** projetos levam dias. Ao parar, `/encerrar-dia` grava um resumo do que foi feito e das próximas demandas. No dia seguinte, `/retomar` lê só o essencial (índice + última sessão) — barato em tokens — e já sabe onde continuar.
- **Autônomo e auto-corretivo:** aprovada a demanda, os agentes seguem o fluxo sozinhos e, ao encontrar erro, diagnosticam e corrigem (até 3 tentativas) antes de pedir ajuda. Só param para decisões de negócio ou ações destrutivas. Ver `docs/autonomia.md`.

## Segurança — prioridade máxima

Todo sistema criado por esta base passa por um **agente de segurança dedicado** e por um baseline obrigatório em [`docs/seguranca.md`](../../../docs/seguranca.md): validação de toda entrada, autenticação/autorização no backend, proteção contra OWASP Top 10, gestão de segredos, headers seguros, rate limiting e auditoria de dependências. **O `/deploy` é bloqueado se a auditoria de segurança achar algo crítico.**

Regra inviolável: nenhum segredo (token, chave, senha, connection string) entra em arquivo versionado. Use `.env` locais (ignorados) e variáveis de ambiente no provedor.
