# Frontend

Next.js + React + TypeScript + Tailwind CSS + Zod.

Estrutura sugerida (o Arquiteto detalha e o Dev implementa):

```
frontend/
├── app/                  ← rotas (App Router)
├── features/<feature>/   ← componentes/hooks/services por feature
├── components/ui/        ← componentes compartilhados
├── lib/                  ← acesso à API, helpers
└── schemas/              ← schemas Zod
```

Inicialização (o Dev roda quando começar): `npx create-next-app@latest .` dentro desta pasta, depois adiciona Tailwind e Zod. Ver `docs/convencoes.md` e `docs/seguranca.md`.
