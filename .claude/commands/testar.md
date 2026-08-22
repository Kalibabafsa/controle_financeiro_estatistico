---
description: Fase 7 — aciona o QA/Tester para escrever/rodar testes, validar critérios de aceite e fidelidade visual.
---

Use o subagente **qa-tester**.

Peça a ele que confirme não haver 🔴 bloqueante (código) nem 🔴 crítico (segurança) em aberto, escreva e rode testes (unitários, integração e e2e conforme o caso), valide cada critério de aceite do PRD e a fidelidade das telas ao protótipo, e produza `docs/planning/qa-report.md` com o veredito.

Só libere `/deploy` se todos os critérios passarem e não houver bug crítico. Caso contrário, devolva ao `dev-senior`.
