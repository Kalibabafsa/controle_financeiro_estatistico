---
description: Fase 4 — aciona o Dev Sênior para implementar as histórias, fiel à arquitetura e ao protótipo.
argument-hint: [história ou feature a implementar]
---

Use o subagente **dev-senior** para implementar.

Contexto do que implementar: $ARGUMENTS

Peça a ele que leia `docs/planning/architecture.md`, `docs/planning/prd.md`, `docs/design-system.md`, os protótipos em `prototipo/`, `docs/convencoes.md` e `docs/seguranca.md`, e implemente **uma história por vez** — respeitando a arquitetura em camadas no backend e reproduzindo **fielmente** o protótipo no frontend. Se alterar o schema do banco, deve rodar a documentação do banco antes de encerrar. Rode checagem de tipos e lint antes de dar como pronto.

Pré-requisito: arquitetura (`/arquitetar`). Ao terminar, recomende `/revisar`.
