# PRD — Sistema Kalibaba

> Documento gerado pela fase `/planejar`. Fonte da verdade sobre requisitos até a fase `/arquitetar`.

## 1. Visão

A Associação Kalibaba é um grupo de futebol de 7 ("baba") que hoje controla mensalidades, despesas e estatísticas do jogo de forma manual (planilhas, mensagens avulsas e um relatório de "Prestação de Contas" montado à mão todo mês em Word/Excel). Isso consome tempo do diretor, é sujeito a erro, e não dá autonomia nem transparência aos ~50 sócios sobre sua própria situação financeira ou sobre a saúde financeira da associação.

O Sistema Kalibaba centraliza em um único app web: (1) o controle financeiro (mensalidades, convidados, despesas semanais, saldo acumulado e geração automática do relatório mensal de prestação de contas) e (2) o controle esportivo do baba de domingo (times, gols, cartões e suspensões). O valor principal é **tirar do diretor o trabalho manual de planilha/PDF** e dar **autonomia e transparência aos sócios** (ver se estão em dia, pagar via Pix, consultar estatísticas e prestação de contas).

Público: diretoria da associação (gestão) e sócios/jogadores (consulta e pagamento). Uso majoritariamente aos domingos (baba) e ao longo do mês (financeiro).

## 2. Personas

### Diretor (administrador)
- **Papel:** gestor da associação (hoje: o próprio dono do projeto). Responsável por cadastro de sócios/convidados, lançamentos financeiros, montagem do baba de domingo (times, gols, cartões) e geração da prestação de contas.
- **Necessidade principal:** parar de montar tudo manualmente em planilha/Word; ter dados confiáveis, histórico e um relatório de prestação de contas gerado com poucos cliques.
- **Dispositivo:** principalmente computador (desktop-friendly), mas precisa funcionar responsivo em celular também (ex.: lançar presença no campo, no domingo).

### Sócio
- **Papel:** associado ativo (ou em DM/inativo), jogador do baba. Quer saber se está em dia com a mensalidade, pagar via Pix, ver estatísticas (suas e do grupo) e a prestação de contas.
- **Necessidade principal:** autonomia — não depender de perguntar ao diretor "estou em dia?" — e transparência sobre para onde vai o dinheiro da associação.
- **Dispositivo:** majoritariamente celular (mobile-first).

## 3. Escopo

### Dentro do MVP (Must/Should — MoSCoW)
- **Must:** autenticação com 2 papéis; cadastro de sócios com status A/DM/I e histórico mensal de status; cadastro simplificado de convidados; lançamento de mensalidades (sócio e convidado) com valor customizável e forma de pagamento (Pix/Dinheiro); inadimplência calculada por ausência de lançamento; lançamento de despesas semanais por categoria cadastrável; categorias de receita também cadastráveis; saldo acumulado entre meses; geração do relatório de Prestação de Contas em PDF; exibição de QR Code Pix para pagamento; confirmação manual de pagamento pelo diretor (fallback); registro do baba do dia (data, presença); sorteio de 4 times por posição; registro de gols e cartões (amarelo/azul/vermelho); suspensão automática por cartão vermelho no próximo domingo; rankings por temporada (artilheiros, cartões, presença); dashboard financeiro (diretor) e dashboard pessoal (sócio).
- **Should:** anexo de comprovante em despesas; visualização da prestação de contas pelo sócio dentro do sistema (transparência); override manual de suspensão e de isenção DM pelo diretor.

### Fora do MVP (Could / futuro)
- Integração automática com API Pix do Banco Inter (webhook de confirmação de pagamento) — **investigar viabilidade na fase `/arquitetar`** (depende de conta PJ Inter com API habilitada, certificado mTLS, client_id/secret). Enquanto não estiver disponível, usa-se confirmação manual.
- Notificações automáticas de cobrança (e-mail/WhatsApp).
- Edição colaborativa/aprovação de lançamentos (fluxo de aprovação além do diretor único).
- App nativo (mobile app); o MVP é web responsivo.

## 4. Requisitos Funcionais

**Autenticação e Perfil**
- RF1 — O sistema deve permitir login com dois papéis: `diretor` (acesso administrativo completo) e `sócio` (acesso restrito ao próprio perfil e a dados gerais).
- RF2 — O sistema deve permitir recuperação de senha via e-mail.
- RF3 — Um sócio não pode visualizar dados financeiros individuais de outro sócio, apenas os seus e os agregados/gerais da associação.

**Associados**
- RF4 — O diretor deve poder cadastrar, editar e listar sócios (nome, contato, status atual).
- RF5 — Cada sócio deve ter um status por mês (A, DM ou I), mantendo **histórico mensal** (não apenas o status atual).
- RF6 — Quando o status do mês for DM, o sistema deve, por padrão, **não gerar cobrança automática** naquele mês, permitindo ao diretor sobrepor manualmente (registrar cobrança mesmo em DM) quando necessário.
- RF7 — Um sócio com status I deve permanecer no histórico do sistema (não pode ser excluído) e pode ser reativado (voltar para A) a qualquer momento pelo diretor.

**Convidados**
- RF8 — O diretor deve poder cadastrar convidados de forma simplificada: nome, telefone (opcional) e "convidado por" (referência opcional a um sócio). Convidados não têm login.
- RF9 — Convidados podem ser incluídos na lista de presença e no sorteio de times de um baba do dia, mas não entram nos rankings de temporada (que são exclusivos de sócios). *(suposição, ver seção 10)*

**Financeiro — Mensalidades e pagamentos avulsos**
- RF10 — O diretor deve poder lançar um pagamento de mensalidade por sócio/mês, com valor sugerido de R$110,00 (editável) e forma de pagamento `PIX` ou `DIN` (dinheiro).
- RF11 — O diretor deve poder lançar um pagamento avulso de convidado por domingo, com valor sugerido de R$30,00 (editável) e forma de pagamento.
- RF12 — A inadimplência de um sócio em um mês deve ser calculada pela **ausência de lançamento de pagamento** naquele mês (e não por um campo booleano "pago/não pago").
- RF13 — O sócio deve poder consultar seu próprio histórico de pagamentos (mês, valor, forma, status). O diretor deve poder consultar o histórico de todos.

**Financeiro — Despesas**
- RF14 — O diretor deve poder lançar despesas com granularidade semanal (ex.: semana de 01/03 a 07/03), categoria e valor.
- RF15 — As categorias de despesa e de receita devem ser cadastráveis livremente pelo diretor (CRUD), não uma lista fixa.
- RF16 — O diretor deve poder anexar um comprovante (imagem ou PDF) a um lançamento de despesa.

**Financeiro — Resumo e saldo**
- RF17 — O sistema deve calcular o saldo da associação de forma **acumulada e contínua** entre os meses (saldo final de um mês = saldo do mês anterior + receitas do mês − despesas do mês), podendo ser negativo.
- RF18 — O dashboard financeiro do diretor deve exibir: receita de mensalidades, receita de convidados, outras receitas (ex.: rendimentos, rifa), receita total, despesa total, saldo do mês e saldo acumulado, além do percentual de inadimplência e número de sócios ativos.

**Prestação de Contas**
- RF19 — O sistema deve gerar um relatório mensal de Prestação de Contas (receitas de sócios, receitas de convidados, outras receitas, despesas por categoria/semana, totais e saldo), exportável em PDF.
- RF20 — Sócios devem poder visualizar/baixar relatórios de meses anteriores dentro do sistema. *(suposição, ver seção 10)*

**Contas a Receber / Pix**
- RF21 — O sistema deve exibir um QR Code Pix (conta da associação, Banco Inter) para pagamento da mensalidade.
- RF22 — O sócio deve poder consultar sua situação individual (adimplente/inadimplente) e a situação geral da associação (nº de sócios ativos, adimplentes, taxa de inadimplência).
- RF23 — *(Fase 2, sujeito a viabilidade técnica)* O sistema deve confirmar automaticamente o pagamento Pix via integração com a API do Banco Inter (webhook de cobrança), atualizando o status do sócio sem intervenção manual.
- RF24 — Enquanto RF23 não estiver disponível (ou como fallback permanente), o diretor deve poder confirmar manualmente um pagamento Pix recebido.

**Futebol — Baba do dia**
- RF25 — O diretor deve poder criar um registro de "baba do dia" com data (domingo).
- RF26 — O diretor deve poder registrar a presença de sócios e convidados em um baba do dia.
- RF27 — O sistema deve oferecer sorteio automático dos presentes em 4 times ("Time 1" a "Time 4"), respeitando a distribuição por posição (1 goleiro + 6 de linha por time), com possibilidade de ajuste manual do resultado pelo diretor.
- RF28 — O diretor deve poder registrar gols por jogador/time dentro de um baba do dia.
- RF29 — O diretor deve poder registrar cartões (amarelo, azul, vermelho) por jogador dentro de um baba do dia.
- RF30 — Um cartão vermelho deve gerar **suspensão automática** do jogador para o baba do domingo seguinte, bloqueando-o de ser sorteado/escalado, com possibilidade de override manual pelo diretor.
- RF31 — Um cartão azul não gera suspensão futura; é apenas registrado como estatística (contagem por jogador).

**Estatísticas**
- RF32 — O sistema deve exibir ranking de artilheiros por temporada.
- RF33 — O sistema deve exibir ranking de cartões (amarelo, azul, vermelho) por temporada.
- RF34 — O sistema deve exibir ranking de presença (frequência) por temporada.
- RF35 — Uma temporada corresponde a um ano civil.

**Configurações**
- RF36 — O diretor deve poder configurar os valores padrão de mensalidade (R$110,00) e de convidado (R$30,00), usados como sugestão nos lançamentos.
- RF37 — O diretor deve poder configurar os dados do Pix exibidos (QR Code) e, futuramente, credenciais da API do Banco Inter.

## 5. Requisitos Não-Funcionais

- RNF1 — **Responsividade:** interface do sócio deve ser mobile-first; interface do diretor deve ser desktop-friendly, mas responsiva para uso ocasional em celular.
- RNF2 — **Usabilidade:** linguagem simples, sem jargão técnico — o público (sócios de diversas idades) não é técnico.
- RNF3 — **Desempenho:** dashboards (financeiro e pessoal) devem carregar em até 2s em conexão 4G típica.
- RNF4 — **Disponibilidade:** aplicação hospedada em Vercel (front) + Render (back) + Supabase (banco); sem SLA formal no MVP, mas sem downtime planejado aos domingos de manhã (horário do baba).
- RNF5 — **Auditoria:** lançamentos financeiros (mensalidade, despesa, ajuste manual) devem registrar quem lançou e quando (log de auditoria), dado o histórico de valores negociados/parciais e a importância da prestação de contas confiável.
- RNF6 — **Backup:** banco de dados (Supabase) deve ter backup automático regular.
- RNF7 — **Acessibilidade básica:** contraste adequado, tamanho de fonte legível, formulários com labels claros (WCAG AA como referência, não certificação formal no MVP).
- RNF8 — **Consistência de dados:** cálculo de inadimplência e de saldo acumulado deve ser sempre derivado dos lançamentos (fonte única da verdade), nunca um valor digitado manualmente à parte.

## 6. Requisitos de Segurança e Privacidade (LGPD)

- RSP1 — **Controle de acesso por papel (RBAC):** todo endpoint do backend deve validar o papel do usuário (diretor vs sócio) antes de retornar dados; um sócio autenticado nunca deve conseguir ler/alterar dados financeiros de outro sócio via manipulação de URL/ID (checar propriedade do recurso, não só autenticação).
- RSP2 — **Dado sensível de saúde (status DM):** o status "Departamento Médico" é dado sensível nos termos da LGPD (art. 5º, II — dado de saúde). O sistema não deve armazenar detalhes clínicos (diagnóstico, lesão específica), apenas o status categórico (A/DM/I) e, se houver, uma observação textual livre e opcional visível **apenas ao diretor** (nunca a outros sócios).
- RSP3 — **Dados financeiros pessoais:** histórico de pagamentos de cada sócio é visível apenas ao próprio sócio e ao diretor — nunca a outros sócios, mesmo em telas agregadas (rankings/dashboards gerais mostram apenas números consolidados, não quem especificamente está inadimplente, exceto para o diretor).
- RSP4 — **Senhas e autenticação:** senhas devem ser armazenadas com hash forte (ex.: bcrypt/argon2); toda comunicação via HTTPS; proteção contra CSRF e XSS conforme `docs/seguranca.md`.
- RSP5 — **Anexos de comprovante:** arquivos anexados a despesas (recibos, prints de Pix) podem conter dados pessoais de terceiros (ex.: nome em recibo) — acesso restrito ao diretor; armazenamento em bucket privado, não publicamente indexável.
- RSP6 — **Retenção de dados:** dados de sócios inativos (status I) e histórico financeiro são mantidos por obrigação de prestação de contas contábil da associação; dados de convidados (sem vínculo formal) devem ter política de retenção definida (sugestão: manter enquanto houver lançamento financeiro associado, permitindo remoção de dados de contato mediante solicitação, preservando o registro financeiro anonimizado).
- RSP7 — **Direitos do titular (LGPD):** sócios devem poder solicitar ao diretor a correção de seus dados cadastrais e, dentro do possível sem comprometer a integridade da prestação de contas, a exclusão de dados de contato.
- RSP8 — **Segredos:** credenciais da futura integração com API do Banco Inter (client_id/secret, certificado mTLS) nunca devem ser versionadas; armazenadas como variáveis de ambiente/segredo no backend (Render), nunca expostas ao frontend.
- RSP9 — **Log de auditoria com dado mínimo:** logs de auditoria (RNF5) devem registrar ação, autor e timestamp, evitando duplicar dados sensíveis desnecessariamente no próprio log.

## 7. Mapa Funcional

1. **Autenticação e Perfil** — login (2 papéis: diretor, sócio), recuperação de senha.
2. **Cadastro de Associados** — sócios, status A/DM/I com histórico mensal.
3. **Cadastro de Convidados** — cadastro simplificado, sem login, com "convidado por".
4. **Módulo Financeiro** — mensalidades (sócio/convidado), despesas semanais por categoria, categorias cadastráveis (receita e despesa), anexos de comprovante, saldo acumulado.
5. **Prestação de Contas** — geração de relatório mensal em PDF, histórico de meses anteriores.
6. **Contas a Receber / Pix** — QR Code Pix, situação individual e geral de adimplência; integração futura com API Inter (webhook), com fallback de confirmação manual.
7. **Módulo de Futebol (Baba do dia)** — registro do domingo, presença, sorteio de times por posição, gols, cartões (amarelo/azul/vermelho), suspensão automática por vermelho.
8. **Estatísticas / Rankings** — artilheiros, cartões, presença, por temporada (ano).
9. **Dashboards** — financeiro (diretor) e pessoal (sócio).
10. **Configurações** — categorias, valores padrão, temporada, dados do Pix.

## 8. Inventário de Telas

### Acesso comum
| Tela | Objetivo | Elementos principais | Quem acessa | Navegação |
|---|---|---|---|---|
| Login | Autenticar usuário | E-mail, senha, "esqueci senha" | Todos | Entrada do sistema |
| Recuperar senha | Redefinir senha | E-mail, envio de link | Todos | A partir do Login |

### Sócio (mobile-first)
| Tela | Objetivo | Elementos principais | Navegação |
|---|---|---|---|
| Home do Sócio | Visão rápida da minha situação | Status (em dia/inadimplente), próximo baba, atalho "Pagar", resumo geral da associação | Entrada pós-login → menu para as demais |
| Minha Situação Financeira | Histórico de pagamentos | Lista mês a mês, valor, forma (Pix/Dinheiro), status | A partir da Home |
| Pagar Mensalidade (Pix) | Pagar via QR Code | QR Code, Pix copia-e-cola, status de confirmação | A partir da Home/Situação Financeira |
| Meu Perfil | Ver/editar dados cadastrais | Nome, contato, status atual | Menu |
| Próximo Baba / Calendário | Ver data do próximo domingo e se está apto/suspenso | Data, aviso de suspensão (cartão vermelho) | Menu |
| Detalhe do Baba (histórico) | Ver resultado de um domingo específico | Times sorteados, gols, cartões daquele dia | A partir de lista de babas anteriores |
| Rankings / Estatísticas | Ver artilheiros, cartões, presença | Filtro por temporada, tabelas de ranking | Menu |
| Prestação de Contas (consulta) | Ver relatórios mensais | Lista de meses, visualizar/baixar PDF | Menu |

### Diretor (desktop-friendly, painel admin)
| Tela | Objetivo | Elementos principais | Navegação |
|---|---|---|---|
| Dashboard Financeiro | Visão executiva | Saldo acumulado, receita/despesa do mês, gráfico, % inadimplência, sócios ativos | Entrada pós-login |
| Gestão de Sócios (lista) | Listar/buscar sócios | Filtro por status, busca, paginação | Menu |
| Cadastro/Edição de Sócio | Criar/editar sócio | Dados pessoais, status atual, histórico de status por mês | A partir da lista |
| Gestão de Convidados (lista) | Listar convidados | Busca, histórico de participações | Menu |
| Cadastro/Edição de Convidado | Criar/editar convidado | Nome, telefone, "convidado por" (sócio) | A partir da lista |
| Lançamento de Mensalidades | Registrar pagamento de sócio | Sócio, mês/ano, valor (padrão R$110, editável), forma (Pix/Dinheiro), status do mês | Menu / Dashboard |
| Lançamento de Pagamento de Convidado | Registrar pagamento avulso | Convidado, domingo, valor (padrão R$30, editável), forma | Menu |
| Gestão de Despesas | Lançar despesas semanais | Semana, categoria, valor, anexo de comprovante | Menu |
| Gestão de Categorias | CRUD de categorias de receita/despesa | Lista, criar/editar/inativar categoria | Configurações |
| Prestação de Contas (geração) | Montar/gerar relatório mensal | Seleção de mês, preview (receitas, despesas, saldo), exportar PDF | Menu |
| Gestão de Inadimplência | Ver quem não pagou no mês | Lista de sócios sem lançamento no mês, ação de marcar cobrado (manual) | Dashboard |
| Gestão do Baba do Dia | Criar registro do domingo | Data, lista de presentes (sócios + convidados) | Menu |
| Sorteio de Times | Sortear 4 times por posição | Selecionar presentes, sortear (1 goleiro + 6 linha/time), resultado editável manualmente | A partir do Baba do Dia |
| Registro de Gols e Cartões | Lançar eventos da partida | Jogador, time, tipo de evento (gol/amarelo/azul/vermelho) | A partir do Baba do Dia |
| Suspensões Ativas | Ver quem está suspenso no próximo domingo | Lista de suspensos por cartão vermelho, override manual | Menu / Baba do Dia |
| Configurações Gerais | Parâmetros do sistema | QR Code/dados Pix, valores padrão, temporada atual, (futuro: credenciais API Inter) | Menu |

**Total: 26 telas** (2 comuns + 8 do sócio + 16 do diretor).

## 9. Histórias de Usuário

**US1 — Login por papel**
Como usuário do sistema, quero fazer login e ser direcionado à área correta (sócio ou diretor), para acessar só o que me cabe.
- Given que sou um sócio cadastrado com senha válida, When faço login, Then sou redirecionado à Home do Sócio.
- Given que sou o diretor com credenciais válidas, When faço login, Then sou redirecionado ao Dashboard Financeiro.
- Given que informo senha incorreta, When tento logar, Then vejo mensagem de erro e permaneço na tela de Login.

**US2 — Consultar minha situação financeira**
Como sócio, quero ver se estou em dia com a mensalidade, para saber se preciso pagar.
- Given que sou sócio e não há lançamento de pagamento para o mês corrente, When acesso minha Home, Then vejo status "inadimplente" com destaque.
- Given que sou sócio e há lançamento de pagamento para o mês corrente, When acesso minha Home, Then vejo status "em dia".

**US3 — Pagar via Pix**
Como sócio, quero ver o QR Code Pix e pagar minha mensalidade, para ter autonomia sem depender do diretor.
- Given que estou na tela "Pagar Mensalidade", When visualizo a tela, Then vejo o QR Code e o código Pix copia-e-cola da associação.
- Given que paguei fora do sistema e ainda não há confirmação, When consulto minha situação, Then continuo como "inadimplente" até o diretor confirmar manualmente (ou webhook confirmar automaticamente, quando disponível).

**US4 — Lançar pagamento de mensalidade**
Como diretor, quero lançar o pagamento de um sócio em um mês, para manter o controle financeiro atualizado.
- Given que estou na tela de Lançamento de Mensalidades, When seleciono um sócio, mês e informo valor e forma de pagamento, Then o lançamento é salvo e o status do sócio naquele mês passa a "em dia".
- Given que não informo valor customizado, When salvo o lançamento, Then o sistema usa o valor padrão configurado (R$110,00).

**US5 — Sócio em DM não é cobrado por padrão**
Como diretor, quero que sócios em DM não sejam cobrados automaticamente, para refletir a realidade de quem está machucado.
- Given que um sócio está com status DM no mês, When o sistema calcula inadimplência, Then esse sócio não aparece como inadimplente, mesmo sem lançamento.
- Given que o diretor decide cobrar um sócio em DM mesmo assim, When ele registra manualmente um lançamento para esse sócio/mês, Then o lançamento é aceito normalmente (override).

**US6 — Lançar despesa semanal com comprovante**
Como diretor, quero lançar uma despesa de uma semana específica com categoria e anexar o comprovante, para manter a prestação de contas transparente.
- Given que estou na tela de Gestão de Despesas, When informo semana, categoria, valor e anexo um arquivo, Then a despesa é salva e o anexo fica disponível para consulta futura.

**US7 — Ver saldo acumulado**
Como diretor, quero ver o saldo acumulado da associação, para saber a real situação de caixa.
- Given que o mês anterior fechou com saldo -R$184,01, When o mês atual tem receita R$500 e despesa R$300, Then o saldo acumulado exibido é -R$184,01 + R$500 - R$300 = R$15,99.

**US8 — Gerar Prestação de Contas em PDF**
Como diretor, quero gerar o relatório mensal de prestação de contas em PDF, para compartilhar com os sócios sem montar manualmente.
- Given que um mês tem lançamentos de receita e despesa completos, When clico em "Gerar PDF" na tela de Prestação de Contas, Then o sistema produz um PDF com receitas, despesas por categoria/semana, totais e saldo daquele mês.

**US9 — Sócio consulta prestação de contas**
Como sócio, quero ver a prestação de contas de meses anteriores, para acompanhar a transparência financeira da associação.
- Given que estou logado como sócio, When acesso "Prestação de Contas", Then vejo a lista de meses disponíveis e posso abrir/baixar o PDF de cada um.

**US10 — Criar baba do dia e sortear times**
Como diretor, quero criar o registro do baba de domingo e sortear os 4 times por posição, para organizar o jogo rapidamente.
- Given que marquei a presença de 28 jogadores (incluindo goleiros suficientes), When clico em "Sortear Times", Then o sistema distribui os presentes em Time 1 a Time 4, respeitando 1 goleiro + 6 de linha por time.
- Given que o sorteio ficou desbalanceado ou eu quero ajustar, When edito manualmente um time, Then a alteração é salva.

**US11 — Registrar cartão vermelho e suspensão automática**
Como diretor, quero registrar um cartão vermelho, para que o jogador fique automaticamente suspenso no próximo baba.
- Given que registrei um cartão vermelho para um jogador no baba de domingo, When chega o próximo baba (domingo seguinte) e tento incluí-lo na lista de presença/sorteio, Then o sistema o marca como suspenso e impede sua inclusão, a menos que o diretor faça override manual.

**US12 — Registrar cartão azul (sem suspensão)**
Como diretor, quero registrar um cartão azul, para contabilizar a estatística sem gerar suspensão futura.
- Given que registrei um cartão azul para um jogador, When consulto o baba seguinte, Then o jogador não está suspenso e pode ser normalmente sorteado.

**US13 — Ver rankings da temporada**
Como sócio, quero ver o ranking de artilheiros da temporada, para acompanhar minha performance e a dos outros.
- Given que estamos na temporada 2026, When acesso "Rankings", Then vejo a lista de jogadores ordenada por gols marcados em 2026, com opção de trocar para ranking de cartões ou presença.

**US14 — Visão geral de inadimplência (diretor)**
Como diretor, quero ver quem está inadimplente no mês, para saber a quem cobrar.
- Given que 5 sócios ativos não têm lançamento de pagamento no mês corrente, When acesso "Gestão de Inadimplência", Then vejo a lista desses 5 sócios com opção de marcar como "cobrado" (controle interno, sem notificação automática).

## 10. Perguntas em Aberto (suposições a validar)

- **Convidados em rankings/times:** assumimos que convidados jogam normalmente no sorteio de times do baba do dia, mas não entram nos rankings de temporada (exclusivos de sócios). Validar com o diretor se está correto.
- **Prestação de Contas visível ao sócio:** assumimos que sócios podem visualizar/baixar relatórios de meses anteriores dentro do sistema (transparência), não confirmado explicitamente pelo usuário — validar no protótipo.
- **Integração API Pix Banco Inter:** viabilidade depende de a associação ter conta PJ Inter com API habilitada, certificado mTLS e client_id/secret. Decisão técnica e de negócio a ser aprofundada na fase `/arquitetar`; enquanto isso, fallback de confirmação manual é o caminho garantido do MVP.
- **Reativação de sócio (I → A):** o fluxo de reativação é livre (diretor só muda o status) ou precisa de alguma confirmação/log adicional? Assumir fluxo livre por ora.
- **Override de status DM:** confirmar se deve haver algum registro/motivo textual quando o diretor decide cobrar um sócio em DM (para fins de transparência), ou se é só uma ação simples sem justificativa.
- **Retenção de dados de convidados:** definir prazo/política formal de retenção e resposta a pedidos de exclusão (LGPD), hoje apenas esboçada na seção 6.
- **Identidade visual do relatório PDF:** o relatório real tem capa, versículo bíblico e logo "Kali Baba" com estádio de fundo — confirmar na fase `/prototipar` se esse estilo deve ser replicado no PDF gerado pelo sistema.
- **Notificações automáticas:** confirmadas como fora do MVP; validar se entram em um roadmap de fase 2 (e-mail vs. WhatsApp).

---

**Status:** aprovado pelo usuário (mapa funcional e inventário de telas validados em conversa de descoberta). Pronto para avançar à fase de prototipagem.
