# Design System

> **Fonte da verdade visual do sistema.** Gerado pelo agente `ux-design` ao final da fase `/prototipar`, a partir dos protótipos aprovados em `prototipo/`. O Dev deve seguir este documento para que o sistema real fique IDÊNTICO ao protótipo. Enquanto a prototipagem não terminar, este arquivo fica como modelo.

## Paleta de cores
<!-- Valores exatos + classes Tailwind. Ex.: Primária #1D4ED8 (bg-blue-700). -->
- Primária: —
- Acento: —
- Neutros (fundo, superfície, borda, texto): —
- Semânticas (sucesso, aviso, erro, info): —
- Tema: claro / escuro (se houver)

## Tipografia
- Família: —
- Escala (tamanhos/pesos por nível: título, subtítulo, corpo, legenda): —

## Espaçamento, raios e sombras
- Grid/espaçamento base: —
- Raio dos cantos: —
- Sombras: —

## Componentes
<!-- Um bloco por componente recorrente, com estados. -->
### Botão
- Primário / secundário / perigo; estados padrão, hover, foco, desabilitado.
### Input
- Padrão, foco, erro; com label e mensagem.
### Card / Tabela / Badge / Modal / Navegação
- —

## Responsividade
- Abordagem mobile-first; breakpoints usados (`sm md lg xl`); comportamento da navegação no mobile.

## Acessibilidade
- Contraste mínimo, foco visível, labels, tamanho de alvo de toque.

## Decisões registradas durante a prototipagem (a consolidar na versão final)

### Ícones
- Biblioteca padrão: **Lucide** (via CDN `https://unpkg.com/lucide@latest`, uso com `<i data-lucide="nome-do-icone">` + `lucide.createIcons()`). Todas as telas já prototipadas usam Lucide de ponta a ponta — não usar Heroicons, Feather ou outra biblioteca no sistema real.
- Emojis (⚽ 🌴 🍻 ☀️) são usados apenas como toque tropical pontual (tela de login, wordmark, badges do módulo de futebol), não como substituto de ícone de UI funcional.

### Template do PDF de Prestação de Contas
- **Decisão do usuário:** o PDF gerado pelo sistema (RF19) deve seguir a identidade **mais comedida do sistema web** (paleta navy `#0A2540` / teal `#1AA79E`, tipografia Poppins/Inter), e **não** replicar o visual "praiano" completo do relatório físico atual da associação (capa com foto de estádio, faixa branca com título azul-marinho, bloco teal inferior, logo "Kali Baba" com palmeiras/canecos/bola).
- Implicação para o Arquiteto/Dev: o template do PDF (fase `/desenvolver`, provavelmente gerado no backend) deve reusar a paleta e tipografia definidas neste documento, com um cabeçalho sóbrio (logo/wordmark pequeno, título, período de referência) em vez da capa ilustrada do relatório antigo. Pode manter o wordmark "Kali Baba" como identificação, mas sem o fundo de estádio/ilustração tropical extensa.

> O restante deste documento (paleta completa, tipografia, componentes, etc.) será consolidado quando todas as telas do inventário (sócio + diretor) estiverem prototipadas e aprovadas.
