# MEMORY — Índice de Memória do Projeto

> **Arquivo curto e barato de ler.** É a PRIMEIRA coisa carregada ao retomar o trabalho (`/retomar`). Mantenha-o enxuto (≈ até 40 linhas): só ponteiros e o essencial. O detalhe fica nos arquivos linkados — leia-os só quando precisar.

## Estado atual
- **Fase do fluxo:** `/prototipar` — entrevista de design em andamento (paleta de cores proposta, aguardando validação do usuário); nenhuma tela criada ainda.
- **Última sessão:** 2026-08-22 → `sessions/2026-08-22.md`
- **Versão do banco:** v000 (sem schema ainda) → `../database/current.md`
- **CI:** não testado ainda (sem código para rodar)

## Onde está cada coisa
- Pendências e próximos passos → `PROXIMOS-PASSOS.md`
- Sessões diárias (histórico) → `sessions/`
- Banco (estado atual) → `../database/current.md`
- Requisitos → `../planning/prd.md`
- Arquitetura → `../planning/architecture.md`

## Decisões importantes (resumo)
<!-- 1 linha cada. Decisões que mudam como o projeto é construído. -->
- Banco Supabase (Postgres) + Prisma; deploy Frontend/Vercel, Backend/Render, Banco/Supabase.
- Status do sócio (A/DM/I) é histórico mensal, não campo estático.
- Valores de mensalidade/convidado customizáveis por lançamento; inadimplência = ausência de lançamento no mês. Pagamento via PIX ou Dinheiro.
- Saldo é cumulativo entre meses (caixa corrente único).
- Relatório mensal "Prestação de Contas" em PDF é obrigatório no MVP.
- Pix: meta é integrar API do Banco Inter (webhook), com confirmação manual como fallback — a confirmar em `/arquitetar`.
- Identidade visual: estilo tropical/praiano/descontraído (inspirado no relatório real do clube) em todo o sistema, não só em acentos.
- Ainda não há nenhum commit no repositório git.

## Como retomar (protocolo)
1. Ler este `MEMORY.md`.
2. Ler `PROXIMOS-PASSOS.md`.
3. Ler APENAS a última sessão em `sessions/`.
Isso basta para saber o que foi feito e o que vem a seguir, sem varrer todo o histórico.
