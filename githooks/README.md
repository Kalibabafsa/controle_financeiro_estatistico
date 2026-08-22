# Git Hooks

Hooks versionados do projeto. Diferente de `.git/hooks/` (que não é versionado), esta pasta é commitada e compartilhada.

## Ativar

Uma vez por clone (o `/iniciar-projeto` já faz isso):

```bash
git config core.hooksPath githooks
chmod +x githooks/pre-commit   # Linux/macOS
```

No Windows, o hook roda via Git Bash (que acompanha o Git for Windows).

## O que o `pre-commit` faz

Se um commit inclui mudança de schema (`schema.prisma`, arquivos em `migrations/` ou em `database/`) **sem** atualizar `docs/database/current.md`, o commit é **bloqueado** com instruções para rodar `/documentar-banco`. É a garantia de "cinto e suspensório" para a documentação do banco nunca ficar desatualizada.

Para pular em uma emergência (evite): `git commit --no-verify`.
