# Próximos Passos / Pendências

> Backlog leve do que falta fazer. Curto e sempre atualizado. É o primeiro lugar que o sistema olha ao **retomar** o trabalho. Mantido pelo agente `documentador`.

## Em andamento
- `/prototipar` (ux-design): entrevista de design em andamento. Paleta de cores tropical/praiana proposta (navy `#0A2540`, teal `#1AA79E`, amarelo-sol `#F2B441` + semânticas de status) aguardando validação do usuário. Nenhuma tela de `prototipo/` criada ainda.

## A fazer (prioridade alta → baixa)
- [ ] Usuário validar/ajustar a paleta de cores proposta (`/prototipar`).
- [ ] ux-design seguir entrevista de design (tipografia, ícones, densidade de informação) e então prototipar as 26 telas do inventário (`docs/planning/prd.md`), uma a uma/em pequenos grupos, com aprovação a cada entrega (`/prototipar`).
- [ ] Consolidar `docs/design-system.md` só após todas as telas aprovadas (`/prototipar`).
- [ ] Seguir para `/arquitetar` assim que `/prototipar` concluir — inclui validar tecnicamente a integração Pix via API do Banco Inter (webhook) com fallback de confirmação manual.
- [ ] Rodar `/git` para o primeiro commit do repositório — ainda não há nenhum commit.
- [ ] Confirmar/criar o repositório `Kalibabafsa/controle_financeiro_estatistico` no GitHub (não verificado; `gh` CLI indisponível no ambiente local).

## Bloqueios / decisões pendentes
- Paleta de cores do design system aguardando validação do usuário.
- Repositório remoto no GitHub não confirmado (sem `gh` CLI para checar/criar).

## Feito recentemente
- `/iniciar-projeto`: Sistema Kalibaba configurado (`project.config.md`, `CLAUDE.md`, `.env.example`, git local + remote).
- `/planejar`: PRD completo aprovado (`docs/planning/prd.md`) — 37 RFs, 8 RNFs, 9 requisitos de segurança/LGPD, mapa funcional, 26 telas, 14 histórias de usuário.
- `/prototipar`: iniciado — estilo visual tropical/descontraído definido; paleta de cores proposta (aguardando validação).
