---
description: Fase 2 — aciona o Designer de UX/UI para prototipar TODAS as telas em HTML e extrair o design system.
---

Use o subagente **ux-design** para a fase de prototipagem.

Peça a ele que:
1. Leia o **inventário de telas** em `docs/planning/prd.md` (se não existir, recomende `/planejar`).
2. **Pergunte primeiro se o usuário tem referência** (texto, imagem, link ou design system existente). Se não tiver, conduza uma entrevista de design para criar o estilo do zero.
3. Prototipe **tela por tela** em HTML + Tailwind (CDN), salvando cada uma em `prototipo/` e mantendo um `prototipo/index.html` navegável. Confirme cada tela antes da próxima.
4. Só depois de TODAS as telas aprovadas, consolide os padrões em `docs/design-system.md`.

Pré-requisito: PRD com inventário de telas. Ao terminar, recomende `/arquitetar`. O sistema real deverá ficar fiel a estes protótipos.
