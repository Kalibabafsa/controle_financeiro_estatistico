# Database

Camada de banco de dados. O banco concreto (SQL Server, MySQL, PostgreSQL, Supabase ou MongoDB) é escolhido no `/iniciar-projeto` e registrado em `project.config.md`.

```
database/
├── prisma/
│   ├── schema.prisma   ← modelo de dados (fonte da verdade)
│   └── migrations/     ← migrations versionadas
└── seed/               ← dados iniciais
```

- Connection string só via `DATABASE_URL` no `.env` (nunca versionada).
- Migrations em produção: `npx prisma migrate deploy` (feito pelo agente DevOps).
- A troca de banco impacta a `DATABASE_URL`, o provider do `schema.prisma` e a camada `repositories/` do backend — o resto do código não muda.
- Postgres/Supabase: mantenha RLS ativo; a chave de serviço nunca vai ao frontend.
