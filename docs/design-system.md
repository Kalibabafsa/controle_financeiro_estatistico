# Design System — Sistema Kalibaba

> **Fonte da verdade visual do sistema.** Gerado pelo agente `ux-design` ao final da fase `/prototipar`, a partir das 26 telas aprovadas em `prototipo/`. O Dev deve seguir este documento para que o sistema real (`frontend/`) fique **idêntico** ao protótipo. Reviewer e QA usam este documento como checklist de fidelidade visual.

## Vibe e princípios

Identidade **tropical/descontraída, porém sóbria o suficiente para dados financeiros**: a associação Kalibaba tem uma linguagem visual informal (futebol de várzea, praiano) que foi abraçada como a cara do produto — não só em acentos pontuais — mas sempre com cuidado para manter legibilidade e hierarquia clara em telas de números (dashboards, extratos, tabelas). Navy + teal dominam a interface no dia a dia (cabeçalhos, navegação, botões, cards de destaque); o amarelo-sol entra com moderação como toque tropical (tela de login, badges, ilustrações do módulo de futebol). Emojis (⚽ 🌴 🍻 ☀️) são usados como esse toque tropical pontual, nunca como substituto de ícone funcional de UI.

## Paleta de cores

Definida via `tailwind.config` (extend.colors) em todas as telas:

```js
colors: {
  navy: { 50: '#EAF0F5', 100: '#CBDCE8', 200: '#9CB9D0', 400: '#1E4E77', 500: '#123A5C', 600: '#0A2540', 700: '#081D33', 900: '#051220' },
  teal: { 50: '#E6F7F5', 100: '#C0EDE9', 200: '#8EDDD6', 400: '#2BC2B7', 500: '#1AA79E', 600: '#158D85', 700: '#0F6E68' },
  sun:  { 50: '#FEF6E7', 100: '#FCE8C2', 300: '#F6C868', 400: '#F2B441', 500: '#E8A33D' },
}
```

- **Primária — Navy** (`navy-600` `#0A2540`): cabeçalhos, sidebar ativa, botões primários (`bg-navy-600 hover:bg-navy-700`), texto de destaque, avatares.
- **Secundária/Acento — Teal** (`teal-500`/`teal-600`): links de ação ("Ver histórico", "Editar"), botões secundários, badges de sucesso/"Em dia"/"Ativo", barras de progresso, gráficos.
- **Acento tropical — Amarelo-sol** (`sun-400`/`sun-500`): badges de status DM (Departamento Médico), toques decorativos no login/hero, blobs de fundo, ícone "trending-down" de despesa no dashboard.
- **Neutros**: escala `slate` padrão do Tailwind — `slate-50` (fundo de página), `slate-100`/`slate-200` (bordas, divisores, fundos de badge neutro), `slate-400` (texto terciário/placeholder), `slate-500` (texto secundário), `slate-600`/`slate-700` (texto de corpo), `slate-800` (texto principal/títulos de item).
- **Semânticas**:
  - Sucesso / Em dia / Ativo: `teal-600` texto, `teal-50` fundo, `teal-200` borda.
  - Atenção / DM: `sun-500` texto, `sun-50` fundo.
  - Perigo / Inadimplente / Inativo (badge neutro, não perigo) / Cartão vermelho: `red-500`/`red-600` texto, `red-50` fundo, `red-200` borda. Status "Inativo" de sócio usa neutro (`slate-100`/`slate-500`), não vermelho — inatividade não é uma falha.
  - Cartões do módulo de futebol (visual literal de cartão, retângulo colorido `h-4 w-3 rounded-sm`): amarelo `bg-yellow-400`, azul `bg-blue-500`, vermelho `bg-red-600`.
- **Tema**: apenas **claro** no MVP (decisão registrada — ver seção de decisões abaixo). Sem `dark:` variants nas telas.

## Tipografia

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet" />
```
```js
fontFamily: { display: ['Poppins', 'sans-serif'], sans: ['Inter', 'sans-serif'] }
```

- **Poppins** (`font-display`): títulos de página (`h1`), títulos de card/seção, wordmark "KALI BABA", texto de botões (`font-display font-semibold`), valores numéricos de destaque (KPIs, saldo, valores monetários grandes).
- **Inter** (`font-sans`, aplicada no `<body>` por padrão): corpo de texto, labels de formulário, texto de tabela/lista, texto secundário.
- **Escala prática observada nas telas**:
  - Título de página (desktop, `h1`): `text-xl font-bold` + `font-display`.
  - Título de card/seção: `text-sm font-semibold` + `font-display`.
  - Label de seção (eyebrow, uppercase): `text-[11px]` ou `text-xs font-semibold uppercase tracking-wide text-slate-400`.
  - Valor de destaque (KPI/saldo): `text-xl` a `text-3xl font-bold` + `font-display`.
  - Corpo/label de formulário: `text-sm` + `font-sans` (padrão).
  - Texto secundário/legenda: `text-xs` ou `text-[11px]`, `text-slate-400`/`text-slate-500`.

## Ícones

Biblioteca padrão: **Lucide**, via CDN — `<script src="https://unpkg.com/lucide@latest"></script>` no `<head>`, ícones marcados com `<i data-lucide="nome-do-icone" class="h-5 w-5"></i>` no HTML, e `lucide.createIcons();` chamado no `<script>` de cada página (sempre como a primeira linha, antes de qualquer `getElementById` que dependa do ícone já ter virado `<svg>`). **Não usar Heroicons, Feather ou outra biblioteca** — todas as 26 telas do protótipo usam Lucide de ponta a ponta.

Mapa de ícones por conceito (manter consistência — mesmo conceito = mesmo ícone em todo o sistema):

| Conceito | Ícone Lucide |
|---|---|
| Início / Home | `home` |
| Minha Situação Financeira / Financeiro (sócio) | `wallet` |
| Pagar Mensalidade / Lançamento de Mensalidade | `credit-card` |
| Próximo Baba / Calendário / Baba do Dia | `calendar` |
| Rankings / Estatísticas | `trophy` |
| Prestação de Contas | `file-text` |
| Meu Perfil / usuário único | `user` |
| Sócios (lista, plural) | `users` |
| Convidados / adicionar pessoa | `user-plus` |
| Sair / logout | `log-out` |
| Menu (hambúrguer, mobile) | `menu` |
| Fechar (drawer, modal) | `x` |
| Notificações | `bell` |
| Voltar / breadcrumb | `arrow-left` |
| Avançar / CTA de ação | `arrow-right` |
| Item de lista clicável | `chevron-right` |
| Expandir/colapsar (acordeão) | `chevron-down` |
| E-mail | `mail` |
| Senha | `lock` |
| Mostrar senha | `eye` / ocultar senha `eye-off` |
| Alerta / erro / atenção | `alert-triangle` |
| Sucesso / confirmação | `check-circle` |
| Carregando (spinner) | `loader-2` (com `animate-spin`) |
| Copiar (Pix copia-e-cola) | `copy` |
| Aguardando (tempo) | `clock` |
| Baixar PDF | `download` |
| Buscar | `search` |
| Editar | `pencil` |
| Excluir / remover | `trash-2` |
| Adicionar | `plus` |
| Anexar arquivo | `upload` / arquivo anexado `paperclip` |
| Ativar/mostrar (categoria) | `eye` / inativar `eye-off` |
| Dashboard | `layout-dashboard` |
| Despesas | `receipt` |
| Categorias | `tags` |
| Inadimplência | `user-x` |
| Pagamento de convidado (avulso) | `banknote` |
| Sorteio de times | `shuffle` |
| Gols e cartões (registro) | `clipboard-list` |
| Suspensões / bloqueio | `shield-alert` |
| Liberar suspensão (override) | `unlock` |
| Configurações | `settings` |
| Segurança / dado protegido | `shield-check` |
| Informação (nota de rodapé) | `info` |
| QR Code | `qr-code` |
| Refazer / re-sortear | `rotate-cw` |
| Confirmar ação | `check` |

Emojis são reservados para toques de identidade (⚽ logo/wordmark, 🌴🍻☀️ no hero de login, 🟨🟦🟥 como rótulo de aba em Rankings) — nunca em botões/ações funcionais do dia a dia.

## Espaçamento, raios e sombras

- **Cards**: `rounded-2xl` (16px), `border border-slate-200`, `shadow-sm`, `bg-white`, padding `p-4` a `p-5`.
- **Inputs, selects, textarea**: `rounded-xl` (12px), `border border-slate-300`, padding `px-3.5 py-2.5`, foco `focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30`.
- **Botões primários**: `rounded-full` (pill), `bg-navy-600 hover:bg-navy-700 text-white`, `font-display font-semibold`, padding `py-2.5`–`py-3` / `px-6`–`px-8`.
- **Botões secundários/outline**: `rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50`.
- **Avatares/badges circulares**: `rounded-full`.
- **Badges/pills de status**: `rounded-full px-2.5 py-0.5 text-xs font-semibold`.
- **Dropzone de upload**: `rounded-xl border-2 border-dashed border-slate-300`.
- **Grid/gap base**: `gap-3`/`gap-4`/`gap-5` entre cards; padding de página `px-4 py-5` (mobile) → `lg:px-8 lg:py-8` (desktop).
- **Sombra padrão**: `shadow-sm` em praticamente todo card/elemento elevado; `shadow-xl` apenas no drawer mobile (maior elevação, é um overlay).

## Componentes

### Botão
- **Primário**: `rounded-full bg-navy-600 text-white font-display font-semibold`, hover `bg-navy-700`, foco `ring-2 ring-teal-500/40 ring-offset-2`, desabilitado `opacity-70 cursor-not-allowed`. Estado de carregamento: label muda (ex. "Entrando...") + ícone `loader-2 animate-spin` substitui o ícone estático.
- **Secundário/outline**: `rounded-full border border-slate-300 text-slate-600`, hover `bg-slate-50`.
- **Perigo** (ex. "Remover contato", "Remover suspensão"): `rounded-full border border-red-200 text-red-600`, hover `bg-red-50`.
- **Segmentado/toggle** (forma de pagamento, tipo de evento): `label` clicável com `border-2`, estado selecionado `border-teal-500 bg-teal-50 text-teal-700`, não selecionado `border-slate-200 bg-white text-slate-500`; input `radio`/`checkbox` real fica `hidden` por trás para acessibilidade/formulário.

### Input
- Padrão: label acima (`text-sm font-medium text-slate-700`), input `rounded-xl border-slate-300`, ícone opcional à esquerda (`absolute inset-y-0 left-0 pl-3.5 text-slate-400`).
- Foco: borda `teal-500` + `ring-2 ring-teal-500/30`.
- Desabilitado (ex. e-mail de login): `bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200`, com nota explicativa abaixo.
- Erro/alerta de formulário: bloco separado acima do campo relevante (`border-red-200 bg-red-50 text-red-700`, ícone `alert-triangle`), não borda vermelha no input isoladamente.

### Card
- `rounded-2xl border border-slate-200 bg-white shadow-sm`. Card de destaque (hero, KPI principal, status): gradiente `bg-gradient-to-br from-navy-600 to-teal-600 text-white` ou variante de estado (`from-red-500 to-red-600` para inadimplente/suspenso).

### Tabela
- Desktop (`lg:block`/`lg:table`): `<table>` com `thead` em `bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400`, linhas com `divide-y divide-slate-100`, hover `hover:bg-slate-50`.
- Mobile (`lg:hidden`): a mesma informação vira lista de cards empilhados (`space-y-3`), nunca uma tabela com scroll horizontal.

### Badge
- `rounded-full px-2.5 py-0.5 text-xs font-semibold`, cor conforme a semântica (ver Paleta). Usado para status (A/DM/I, Em dia/Inadimplente, Apto/Suspenso, Cobrado/Não cobrado, Ativa/Inativa).

### Modal / Drawer
- Não há modal centralizado tradicional no protótipo — o padrão usado é **drawer lateral deslizante** (mobile, menu de navegação): `fixed inset-y-0 left-0 w-72 -translate-x-full` → `translate-x-0` ao abrir, com overlay `fixed inset-0 bg-slate-900/40`. Fechamento por botão `x`, clique no overlay, ou navegação.

### Navegação
- **Sócio (mobile-first)**: bottom tab bar fixa (`fixed inset-x-0 bottom-0`) com 5 ícones (Início, Financeiro, Baba, Rankings, Perfil) + drawer lateral com o menu completo (7 destinos + Sair) acessível via ícone `menu` no topo.
- **Diretor (desktop-first)**: sidebar fixa à esquerda (`lg:w-72`/`lg:w-64`) agrupada por seção com rótulo eyebrow (Visão geral, Financeiro, Associados, Futebol, Configurações), sem bottom-nav; no mobile vira o mesmo drawer lateral.
- Item ativo: fundo `bg-navy-50`, texto `text-navy-600 font-semibold` (sidebar/drawer); no bottom-nav, ícone/texto em `text-navy-600` vs. `text-slate-400` inativo.
- Elemento "Mapa do protótipo" (link fixo no canto superior, `border-dashed`) existe **só no protótipo** para navegação de revisão — não faz parte do sistema real.

### Estados (vazio / erro / carregando / sucesso)
- **Vazio**: ícone circular neutro (`bg-navy-50 text-navy-400` ou similar) + título + descrição curta, dentro de card `border-dashed`.
- **Erro/alerta**: bloco `border-red-200 bg-red-50 text-red-700` com ícone `alert-triangle`, título em negrito + descrição.
- **Carregando**: label do botão muda + ícone `loader-2 animate-spin` substitui o ícone padrão; botão fica `disabled`.
- **Sucesso**: bloco `border-teal-200 bg-teal-50 text-teal-700` com ícone `check-circle`, aparece no topo do formulário e some sozinho após alguns segundos (padrão: 3–4s via `setTimeout`).

## Responsividade

- **Abordagem**: mobile-first para as telas do **sócio**; desktop-first (porém responsivo) para as telas do **diretor** — conforme RNF1 do PRD.
- **Breakpoints usados**: `sm` (640px, ajustes de grid em formulários — 1 coluna → 2 colunas), `lg` (1024px, breakpoint principal que alterna entre o "mobile shell" — bottom-nav/drawer/tabela-vira-card — e o "desktop shell" — sidebar fixa/tabela completa).
- **Sócio**: bottom tab bar + drawer no mobile; nos breakpoints `lg:`, vira sidebar fixa e o bottom-nav some.
- **Diretor**: sidebar fixa nos breakpoints `lg:`; abaixo disso, topo com hambúrguer abre o mesmo menu em drawer. Tabelas (`socios-lista`, `convidados-lista`, `inadimplencia`, `despesas`) têm par explícito tabela-desktop/lista-cards-mobile.

## Acessibilidade

- **Contraste**: texto sobre fundo branco em `slate-700`/`slate-800` (AA); texto sobre navy/teal em branco ou tons muito claros (`teal-50`, `navy-50`).
- **Foco visível**: todo elemento interativo tem `focus:ring-2 focus:ring-teal-500/30` (inputs) ou `focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2` (botões).
- **Labels**: todo campo de formulário tem `<label for="id">` associado; nenhum campo depende só de `placeholder`.
- **Alvo de toque**: botões/ícones clicáveis com no mínimo `h-9`/`h-10` (~36–40px) em contextos mobile.
- **Ícones**: decorativos por padrão (sem `aria-label`); botões que têm **só** ícone (ex. notificações, fechar drawer, editar linha de tabela) levam `aria-label` descritivo.
- **Dados sensíveis (LGPD)**: campos de observação DM (Departamento Médico) sempre acompanhados de nota textual "Visível apenas para você (diretor)" — reforço visual da regra RSP2, não apenas controle de acesso no backend.

## Decisões registradas durante a prototipagem

### Ícones
Ver seção "Ícones" acima — Lucide é a biblioteca oficial e obrigatória.

### Modo escuro
Fora do MVP — apenas tema claro implementado em todas as 26 telas. Se o produto evoluir para dark mode, será uma decisão de fase futura, não coberta por este design system.

### Template do PDF de Prestação de Contas
**Decisão do usuário:** o PDF gerado pelo sistema (RF19) deve seguir a identidade **mais comedida do sistema web** (paleta navy `#0A2540` / teal `#1AA79E`, tipografia Poppins/Inter), e **não** replicar o visual "praiano" completo do relatório físico atual da associação (capa com foto de estádio, faixa branca com título azul-marinho, bloco teal inferior, logo "Kali Baba" com palmeiras/canecos/bola).
Implicação para o Arquiteto/Dev: o template do PDF (gerado no backend) deve reusar a paleta e tipografia definidas neste documento, com um cabeçalho sóbrio (wordmark pequeno, título, período de referência — ver preview implementado em `prototipo/prestacao-contas-geracao.html`) em vez da capa ilustrada do relatório antigo.

### QR Code Pix no protótipo
As telas `pagar-mensalidade.html` e `configuracoes.html` usam a API pública `api.qrserver.com` apenas para exibir um QR Code visualmente realista no protótipo. **No sistema real, o QR Code deve ser gerado a partir do payload Pix real (EMV) vindo do backend**, não de um serviço de terceiros.

## Inventário de telas do protótipo (referência)

Todas as 26 telas do inventário do PRD foram prototipadas e aprovadas em `prototipo/`, mapeadas em `prototipo/index.html`:

**Acesso comum:** `login.html`, `recuperar-senha.html`

**Sócio:** `home-socio.html`, `situacao-financeira.html`, `pagar-mensalidade.html`, `meu-perfil.html`, `proximo-baba.html`, `detalhe-baba.html`, `rankings.html`, `prestacao-contas.html`

**Diretor:** `dashboard-financeiro.html`, `socios-lista.html`, `socio-form.html`, `convidados-lista.html`, `convidado-form.html`, `lancamento-mensalidade.html`, `lancamento-convidado.html`, `despesas.html`, `categorias.html`, `prestacao-contas-geracao.html`, `inadimplencia.html`, `baba-dia.html`, `sorteio-times.html`, `gols-cartoes.html`, `suspensoes.html`, `configuracoes.html`

O Dev deve traduzir estas telas para React/Next.js + Tailwind com **fidelidade 1:1** (mesmas classes utilitárias sempre que possível), preservando os padrões de componente, cores, tipografia e responsividade documentados acima.
