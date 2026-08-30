# Próximos Passos / Pendências

> Backlog leve do que falta fazer. Curto e sempre atualizado. É o primeiro lugar que o sistema olha ao **retomar** o trabalho. Mantido pelo agente `documentador`.

## Em andamento
- `/prototipar` (ux-design): 15/26 telas prontas e aprovadas em `prototipo/` (9 do sócio completas + dashboard financeiro, sócios lista/form, convidados lista/form). Design system (paleta, tipografia, ícones Lucide) já validado, registrado parcialmente em `docs/design-system.md`. Restam ~11 telas do lado do diretor.

## A fazer (prioridade alta → baixa)
- [ ] Continuar prototipando o restante do diretor: Lançamento de Mensalidades, Lançamento de Pagamento de Convidado, Gestão de Despesas, Gestão de Categorias, Prestação de Contas (geração, lado diretor), Gestão de Inadimplência, Gestão do Baba do Dia, Sorteio de Times, Registro de Gols e Cartões, Suspensões Ativas, Configurações Gerais (`/prototipar`).
- [ ] Consolidar `docs/design-system.md` (paleta completa, tipografia, componentes, responsividade, acessibilidade) só após todas as 26 telas aprovadas.
- [ ] Seguir para `/arquitetar` assim que `/prototipar` concluir — inclui validar tecnicamente a integração Pix via API do Banco Inter (webhook) com fallback de confirmação manual.

## Bloqueios / decisões pendentes
- Nenhum bloqueio técnico no momento.

## Feito recentemente
- `/iniciar-projeto`: Sistema Kalibaba configurado (`project.config.md`, `CLAUDE.md`, `.env.example`, git local + remote).
- `/planejar`: PRD completo aprovado (`docs/planning/prd.md`) — 37 RFs, 8 RNFs, 9 requisitos de segurança/LGPD, mapa funcional, 26 telas, 14 histórias de usuário.
- `/prototipar`: paleta de cores, tipografia (Poppins/Inter) e ícones (Lucide) validados; 15/26 telas prontas e aprovadas em `prototipo/` (ver `sessions/2026-08-24.md`).
- Ferramentas locais: Git no PATH e GitHub CLI (`gh` 2.98.0) instalados via `winget` (2026-08-24).
- Git: primeiro `git push` feito (branches `main` e `develop`) para `github.com/Kalibabafsa/controle_financeiro_estatistico` — repositório remoto confirmado, `gh` autenticado com escopo `workflow` (2026-08-24).
