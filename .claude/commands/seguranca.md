---
description: Fase 6 — aciona o Engenheiro de Segurança para auditoria (OWASP, segredos, authz, dependências).
---

Use o subagente **seguranca** para auditar o sistema.

Peça a ele que leia `docs/seguranca.md`, `docs/planning/architecture.md`, `docs/planning/prd.md` e o `code-review.md`, e faça a auditoria profunda de `backend/`, `frontend/` e `database/`: OWASP Top 10, varredura de segredos, autorização por rota, validação Zod, headers/CORS/cookies, rate limiting e `npm audit`. Produza `docs/planning/security-report.md`.

Um achado 🔴 **crítico bloqueia o `/deploy`** — devolva ao `dev-senior` e re-audite após a correção. Se aprovado, recomende `/testar`.
