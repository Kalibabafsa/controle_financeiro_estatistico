---
description: Fase 8 — aciona o DevOps para checagens finais e deploy (só após segurança e QA aprovarem).
---

Use o subagente **devops-deploy**.

Peça a ele que verifique a aprovação da segurança em `docs/planning/security-report.md` e do QA em `docs/planning/qa-report.md` (se algum reprovou, PARAR), rode o checklist pré-deploy (sem segredos versionados, CI verde, tsc/lint/testes ok, build ok, migrations, variáveis no provedor) e conduza o deploy de banco, backend e frontend conforme `project.config.md`.

**Confirme com o usuário antes do push/deploy final.**
