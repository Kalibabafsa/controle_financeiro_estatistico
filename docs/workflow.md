# O Fluxo de Trabalho

Este projeto usa um fluxo profissional de desenvolvimento, dividido em 7 fases. Cada fase é conduzida por **um agente sênior** e produz um **artefato** que alimenta a fase seguinte. Você dispara cada fase por um comando (`/`).

```
 (setup)        /iniciar-projeto  → preenche project.config.md (banco + GitHub)
    │
    ▼
 1  /planejar      → analista-po      → docs/planning/prd.md (mapa funcional + inventário de telas)
    │
    ▼
 2  /prototipar    → ux-design        → prototipo/*.html + docs/design-system.md
    │
    ▼
 3  /arquitetar    → arquiteto        → docs/planning/architecture.md
    │
    ▼
 4  /desenvolver   → dev-senior       → código FIEL ao protótipo (frontend/ backend/ database/)
    │
    ▼
 5  /revisar       → code-reviewer    → docs/planning/code-review.md
    │                                     └─ tem 🔴? volta pro passo 4
    ▼
 6  /seguranca     → seguranca        → docs/planning/security-report.md
    │                                     └─ tem 🔴 crítico? volta pro passo 4
    ▼
 7  /testar        → qa-tester        → docs/planning/qa-report.md
    │                                     └─ reprovou? volta pro passo 4
    ▼
 8  /deploy        → devops-deploy    → ambiente publicado
```

Auxiliar: **`/git`** — commit e push seguindo Conventional Commits, sem versionar segredos. Use quando quiser salvar progresso no GitHub.

## Por que essa ordem importa

- **Planejar antes de codar** evita construir a coisa errada. O PRD define o "o quê", o mapa funcional e o inventário de telas.
- **Prototipar antes de arquitetar/codar** define o visual completo em HTML e mata o retrabalho de design. O sistema real nasce fiel a protótipos já aprovados.
- **Arquitetar depois do protótipo** deixa a arquitetura suportar exatamente o que as telas exigem. Decisões de dados, API e ameaças ficam registradas.
- **Revisar antes de auditar segurança** limpa o óbvio para a auditoria focar no que importa.
- **Segurança antes de testar e deployar** garante que o sistema é seguro por design. Um achado crítico **bloqueia o deploy**.
- **Testar antes de deployar** garante que os critérios de aceite passam.

## Regras do fluxo

1. **Não pule fases.** Cada agente checa se o artefato da fase anterior existe.
2. **Ciclos são normais.** Reviewer, Segurança e QA podem devolver o trabalho ao Dev. É o processo funcionando.
3. **O `project.config.md` é a fonte da verdade.** Todos os agentes o leem antes de agir e atualizam o estado ao terminar.
4. **Uma história por vez** no desenvolvimento — mais fácil de revisar, auditar e testar.
5. **Deploy bloqueado** enquanto houver 🔴 crítico de segurança ou reprovação de QA.

## Papéis dos agentes

| Agente | Papel | Lê | Entrega |
|---|---|---|---|
| `analista-po` | Requisitos, mapa funcional, telas | config | `prd.md` |
| `ux-design` | Protótipo HTML + design system | prd (inventário de telas) | `prototipo/*.html`, `design-system.md` |
| `arquiteto` | Arquitetura e dados | prd, protótipo, design-system, segurança | `architecture.md` |
| `dev-senior` | Implementação fiel ao protótipo | architecture, design-system, protótipo, convenções, segurança | código |
| `code-reviewer` | Qualidade + fidelidade | architecture, prd, design-system, protótipo | `code-review.md` |
| `seguranca` | AppSec/OWASP | segurança, architecture, code-review | `security-report.md` |
| `qa-tester` | Testes + aceite + fidelidade | prd, protótipo, reports | `qa-report.md` |
| `devops-deploy` | Build e deploy | config, reports | ambiente publicado |
| `documentador` | Doc viva + banco + memória (apoio) | tudo relevante | docs atualizadas |

## Iterando em features novas

Depois do primeiro ciclo, para cada feature você repete a partir do `/planejar` (ou `/desenvolver` se o requisito já estiver claro), sempre passando por revisão, segurança, QA e deploy. Mesmo fluxo, escala menor.

## A fase de protótipo (a que evita retrabalho de design)

Depois de `/planejar`, o `/prototipar` desenha o sistema inteiro antes de uma linha de código real:

1. O `ux-design` **pergunta se você tem referência** (texto, imagem, link ou design system). Se não tiver, ele te **entrevista** (cores, botões, tipografia, tom) e propõe uma direção.
2. Vocês criam **tela por tela**, em HTML + Tailwind, cada uma salva em `prototipo/`, com um `index.html` navegável. Você aprova cada tela antes da próxima.
3. Só quando **todas** as telas do inventário estão aprovadas, ele consolida os padrões em `docs/design-system.md`.
4. Nas fases seguintes, o Dev constrói o sistema real **idêntico** ao protótipo; Reviewer e QA verificam a fidelidade.

Assim, quando o código começa, o visual já está decidido e aprovado — nada de refazer tela depois de já ter a lógica pronta.

## Ciclo diário (projetos de vários dias)

Um sistema raramente nasce em um dia. Para não perder contexto entre sessões:

- **Comece o dia com `/retomar`.** Ele lê só o essencial da memória (`docs/memory/MEMORY.md`, `PROXIMOS-PASSOS.md` e a última sessão) — de propósito, para gastar poucos tokens — e resume onde paramos e as próximas demandas.
- **Trabalhe normalmente** pelo fluxo das 7 fases. Os agentes avançam de forma autônoma e corrigem erros sozinhos (ver `docs/autonomia.md`).
- **Termine o dia com `/encerrar-dia`.** O `documentador` grava `docs/memory/sessions/YYYY-MM-DD.md` com o que foi feito, decisões, alterações de banco e próximas demandas, e atualiza o índice.

## Documentação viva

- O agente **`documentador`** (apoio) mantém a doc sempre fiel ao código.
- **Banco:** `/documentar-banco` a cada mudança de schema. O estado atual fica em `docs/database/current.md`; o anterior é arquivado em `docs/database/history/`; o `CHANGELOG.md` registra o que mudou. Nada de histórico perdido.
- **Pendências:** `docs/memory/PROXIMOS-PASSOS.md` é o backlog leve, sempre atualizado — o que está em andamento, o que falta e o que já saiu.

## Autonomia e auto-correção

Aprovada a demanda, os agentes seguem o fluxo sem pedir confirmação a cada passo. Se um passo falha (build, teste, lint, migration), o agente diagnostica a causa raiz, corrige e reexecuta — até 3 tentativas. Só interrompe para decisões de negócio, ações destrutivas ou quando as tentativas se esgotam. Detalhes em `docs/autonomia.md`.
