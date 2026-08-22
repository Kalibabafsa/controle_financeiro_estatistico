# Backend

Node.js + Express + TypeScript + Prisma, arquitetura em camadas.

Fluxo obrigatório: **route → controller → service → repository → Prisma**.

```
backend/src/
├── server.ts        ← sobe o HTTP server
├── app.ts           ← Express + middlewares + rotas
├── routes/
├── controllers/     ← valida (Zod), chama service, responde
├── services/        ← regra de negócio pura
├── repositories/    ← única camada que toca o banco
├── middlewares/     ← auth, erro, rate limit
├── schemas/         ← Zod
├── lib/             ← prisma client, helpers
└── errors/
```

Regras completas em `docs/convencoes.md` e `docs/seguranca.md`. O banco concreto vem de `project.config.md`.
