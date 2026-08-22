---
description: Fase 3 — aciona o Arquiteto para definir arquitetura, modelo de dados e contratos de API, já com base nos protótipos.
---

Use o subagente **arquiteto** para a fase de arquitetura.

Peça a ele que leia `docs/planning/prd.md`, `docs/design-system.md`, os protótipos em `prototipo/`, `project.config.md` e `docs/seguranca.md`, e produza `docs/planning/architecture.md` com: modelo de dados (schema Prisma para o banco escolhido), contratos de API com autorização por endpoint e a(s) tela(s) que consomem, mapa telas → componentes, estrutura de pastas de `backend/` e `frontend/`, resumo de modelo de ameaças e as decisões arquiteturais.

A arquitetura deve suportar tudo que as telas do protótipo exigem. Pré-requisito: PRD e protótipo. Se faltarem, recomende `/planejar` ou `/prototipar`. Ao terminar, recomende `/desenvolver`.
