---
description: Fase 5 — aciona o Code Reviewer para revisar o código e a fidelidade ao protótipo.
---

Use o subagente **code-reviewer** para revisar as mudanças recentes.

Peça a ele que analise o diff/arquivos alterados contra a arquitetura, o PRD, as convenções e a fidelidade ao protótipo (`prototipo/` + `docs/design-system.md`), e produza `docs/planning/code-review.md` com achados classificados por severidade (🔴/🟡/🟢).

Se houver 🔴 bloqueante, recomende voltar ao `dev-senior`. Se estiver limpo, aprove e recomende `/seguranca`.
