---
description: Auxiliar — cria commit e/ou push seguindo Conventional Commits, sem versionar segredos.
argument-hint: [descrição curta do que mudou]
---

Conduza um commit seguro. Contexto: $ARGUMENTS

Passos:
1. `git status` e `git diff` para ver o que mudou.
2. **Varra por segredos** nos arquivos a commitar (tokens, senhas, chaves, connection strings). Se achar, PARE e avise.
3. Adicione **arquivos específicos** (`git add <arquivo>`), **nunca** `git add -A` nem `git add .`. Confirme que `.env` não está incluído.
4. Faça o commit com mensagem no formato **Conventional Commits**:
   - `feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`, `docs: ...`, `chore: ...`
   - assunto curto e imperativo, em inglês; corpo opcional em PT-BR explicando o porquê.
5. Só faça `git push` se o usuário confirmar. Se for abrir PR, use `gh pr create` preenchendo o template.

Nunca commite `.env`, `settings.local.json` ou qualquer segredo. Se a branch não for a de trabalho (`develop`), confirme com o usuário antes.
