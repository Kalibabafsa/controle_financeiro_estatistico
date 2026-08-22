# Banco de Dados — Estado Atual

> **Fonte da verdade do schema.** Sempre reflete o banco em produção/dev AGORA. Atualizado pelo agente `documentador` (comando `/documentar-banco`) a cada mudança de schema. Ao mudar, uma cópia do estado anterior é arquivada em `history/` antes de sobrescrever este arquivo.

- **Banco:** {{BANCO}}
- **Versão do schema:** v000
- **Última atualização:** {{DATA}}
- **Migration correspondente:** —

## Tabelas

<!-- Uma seção por tabela. Preenchido pelo documentador a partir do schema.prisma / migrations. -->

### (exemplo) users
| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| id | uuid | não | gen_random_uuid() | PK |
| email | text | não | — | único; login |
| password_hash | text | não | — | bcrypt/argon2 |
| created_at | timestamptz | não | now() | — |

**Relacionamentos:** —
**Índices:** email (único)
**RLS / políticas:** (se Postgres/Supabase) descrever

## Enums

<!-- Lista de enums e seus valores. -->

## Observações de segurança
- Connection string só via `DATABASE_URL` (env).
- Chave de serviço/admin nunca no frontend.
