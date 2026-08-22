---
description: Fase 1 — aciona o Analista/PO para levantar requisitos por conversa e escrever o PRD com mapa funcional e inventário de telas.
---

Use o subagente **analista-po** para conduzir a fase de planejamento.

Peça a ele que:
1. Leia `project.config.md`.
2. Faça a descoberta de requisitos **conversando** com o usuário (uma pergunta por vez), provocando e lembrando do que ele pode ter esquecido.
3. Produza o PRD em `docs/planning/prd.md` com histórias, critérios de aceite, requisitos de segurança/privacidade, o **mapa funcional** e principalmente o **inventário de telas** (base da fase de protótipo).

Só feche quando o mapa funcional e o inventário de telas estiverem completos e confirmados. Ao terminar, recomende `/prototipar`. Se o `project.config.md` ainda tiver placeholders `{{...}}`, avise que é preciso rodar `/iniciar-projeto` antes.
