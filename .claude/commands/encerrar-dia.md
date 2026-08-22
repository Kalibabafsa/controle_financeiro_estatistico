---
description: Fim de dia — documenta tudo que foi feito hoje e deixa a memória pronta para amanhã.
---

Use o subagente **documentador** para fechar o dia. Ele deve:

1. Descobrir a data de hoje.
2. Criar `docs/memory/sessions/YYYY-MM-DD.md` a partir de `docs/memory/_template-sessao.md`, preenchendo: contexto, o que foi feito hoje, decisões, alterações no banco (com a versão, se houve), estado do fluxo ao parar, próximas demandas e pendências.
3. Atualizar `docs/memory/PROXIMOS-PASSOS.md` (mover concluídos, deixar claro o que falta).
4. Atualizar o índice `docs/memory/MEMORY.md` (fase atual, data da última sessão, versão do banco, CI) — mantendo-o curto.
5. Se houve mudança de schema hoje e ainda não foi documentada, rodar também `/documentar-banco`.
6. Opcional: sugerir um `/git` para salvar o progresso no GitHub.

Baseie-se no que realmente aconteceu na conversa/sessão. Seja objetivo: quem ler amanhã tem que entender sem abrir mais nada. Ao final, confirme que a memória está pronta para o `/retomar` de amanhã.
