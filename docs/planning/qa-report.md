# QA Report — Sistema Kalibaba

> Gerado pela fase `/testar`, a partir de `docs/planning/prd.md`, `docs/planning/architecture.md`, `docs/design-system.md`, protótipos em `prototipo/`, `docs/planning/code-review.md` e `docs/planning/security-report.md`.

## Atualização (rodada 2) — re-verificação após correções do dev-senior

**Veredito atualizado: `/deploy` LIBERADO.** O `dev-senior` reportou ter corrigido os 3 itens pré-requisito (🔴 FK/cascade, 🟠 A1 PII, 🟠 A2 trust proxy) mais o bug 🟡 #4 (truncamento da descrição do Pix), a violação de camada em `rankings.service.ts` (🟡 #3 do code review) e as 3 divergências de fidelidade visual apontadas (Home do Sócio, Inadimplência, Pagar Mensalidade). O `/seguranca` já re-auditou A1/A2. **Eu não confiei só nesses relatos — refiz a verificação de forma independente**, com os resultados abaixo. Todas as seções originais (1–7) foram mantidas intactas logo após esta, para rastreabilidade de como cada achado foi encontrado originalmente; esta seção documenta a rodada de re-teste.

### O que eu verifiquei de novo, e como

1. **Rodei a suíte de testes eu mesmo, do zero** (`cd backend && npx vitest run`): **101/101 testes passando**, 15 arquivos de teste, nenhuma falha. Os 5 testes que antes falhavam de propósito agora passam:
   - `tests/integration/presenca-fk-cascade.spec.ts` — as 2 asserções que esperavam `replaceAll` **funcionar** (`.resolves.toHaveLength(1)`, nunca alteradas por mim ou pelo dev — só a infraestrutura de teste em `tests/helpers/fakePrisma.ts` foi estendida com suporte a `teamMember.deleteMany`, `gameEvent.deleteMany` e um novo model `suspension`, necessário porque a correção real passou a apagar esses vínculos em cascata) agora passam **porque o código de produção de fato executa essa limpeza**, não porque a asserção foi enfraquecida. Verifiquei isso lendo o código de produção diretamente (não só o resultado verde do teste) — ver item 2.
   - `tests/integration/authorization.spec.ts` (describe "A1") — a asserção `not.toContain('bruno@example.com')` (inalterada) agora passa.
   - `tests/unit/emv.spec.ts` e `tests/unit/pix.service.spec.ts` (testes `[BUG conhecido]`, ambos com a asserção original de que a descrição completa "MENSALIDADE KALIBABA 8/2026" deve aparecer no payload) agora passam.
   - Também notei que o dev **atualizou intencionalmente** um teste meu em `tests/unit/inadimplencia.service.spec.ts` (o antigo "nunca expõe dado financeiro" virou "inclui telefone, valor devido... — dado seguro por ser rota exclusiva do diretor"), porque a correção de fidelidade da tela de Inadimplência (🟡 #7) exige que o backend passe a devolver telefone/valor/dias em aberto nessa rota — o que é seguro porque `GET /inadimplencia` é `requireRole('DIRETOR')` (reconfirmado em `inadimplencia.routes.ts`), não uma rota agregada nem acessível a sócios. Não é "alterar teste para forçar verde" — é uma mudança de contrato legítima e bem justificada no comentário do próprio teste, que eu revisei linha a linha.
2. **Confirmei cada correção por leitura direta do código de produção** (não apenas pelo relatório do dev nem pelo teste passando):
   - `backend/prisma/schema.prisma`: `TeamMember.presenca`, `GameEvent.presenca` e `Suspension.originEvent` agora têm `onDelete: Cascade`, com comentário explicando a decisão.
   - `backend/src/repositories/presencas.repository.ts`: `replaceAll` agora apaga explicitamente, na mesma transação e na ordem correta de dependência (`Suspension` → `GameEvent`/`TeamMember` → `Presenca`), antes de recriar — e `presenca.service.ts` registra em `AuditLog` (`presenca.replace_com_perda_de_dados`) sempre que essa limpeza de fato remove times/eventos já lançados. Isso é exatamente a opção (a) que o `code-review.md` original sugeriu.
   - `backend/src/repositories/gameEvents.repository.ts`, `presencas.repository.ts`, `babas.repository.ts` e `teams.repository.ts`: todos trocaram `include: { socio: true, convidado: true }` por um `SAFE_PARTICIPANT_SELECT` (`{ select: { id, name } }`) — e-mail/telefone não trafegam mais nessas rotas.
   - `backend/src/app.ts`: agora chama `app.set('trust proxy', env.TRUST_PROXY_HOPS)`; `env.ts` define `TRUST_PROXY_HOPS` com default `1`.
   - `backend/src/lib/pix/emv.ts`: a descrição agora usa `normalizeDescription()` (limite de 99 caracteres, conforme o manual do Bacen) em vez de reaproveitar `normalize()` (limite de 25, correto só para nome/cidade).
   - `backend/src/services/rankings.service.ts`: não importa mais `prisma` para executar query nenhuma (só um `import type { EventType }`, que é apenas um tipo, não uma dependência de runtime do Prisma Client — não viola a regra "repository é o único a importar Prisma"); o branch de presença agora usa `presencasRepository.findBySeasonForSocios` e `babasRepository.countBySeason`.
3. **Refiz a comparação visual com os protótipos** (não apenas conferi se o code review dizia "corrigido"):
   - `frontend/app/(socio)/inicio/page.tsx`: grid voltou a ter **3 cards** (Sócios ativos / Adimplência / Inadimplência), igual a `prototipo/home-socio.html`. `Adimplência` é `100 - percentualInadimplencia`, como eu havia sugerido.
   - `frontend/app/(diretor)/inadimplencia/page.tsx`: tabela agora tem as colunas **Telefone / Dias em aberto / Valor devido**, e os cards de resumo viraram **"Valor total em aberto"** e **"Taxa de inadimplência"**, batendo com `prototipo/inadimplencia.html`. O toggle "Cobrado?" client-only continua como estava (dívida técnica aceita, nunca foi um bloqueador).
   - `frontend/app/(socio)/pagar/page.tsx`: agora consulta `/me/situacao` antes de decidir o que mostrar e renderiza o 2º estado do protótipo ("Pagamento confirmado!", com valor/data) quando a mensalidade do mês já está paga — reproduzindo fielmente os dois estados de `prototipo/pagar-mensalidade.html`.
4. **Rodei, eu mesmo, verificações adicionais que não tinham sido feitas na rodada 1** (a pedido explícito desta rodada, para não depender só do relato do dev):
   - `cd backend && npx tsc --noEmit` → **limpo**.
   - `cd frontend && npx tsc --noEmit` → **limpo**.
   - `cd backend && npx eslint . --ext .ts` → **limpo**.
   - `cd backend && npm run build` (tsc → `dist/`) → **sucesso**.
   - `cd frontend && npm run build` (Next.js, produção) → **sucesso**, 29 rotas geradas (28 estáticas + as dinâmicas `[id]`), sem erros de tipo/lint durante o build.

### O que continua em aberto (não bloqueia `/deploy`, já era conhecido)

- 🟡 M1 (security-report.md) — `backend/src/middlewares/upload.middleware.ts` ainda valida só o `Content-Type` declarado pelo cliente, não os magic bytes reais do arquivo. Não foi tocado nesta rodada. Mantenho a recomendação original: barato de corrigir, vale entrar no próximo ciclo, **não bloqueia este deploy** (nunca bloqueou, era "recomendado corrigir junto", não pré-requisito).
- 🟢 #5 (sorteio ligeiramente desbalanceado em cenários fora do "ideal" de 28 presentes) e a nota estrutural sobre `gols-cartoes` virar um redirect — nenhum dos dois foi mencionado como corrigido, nenhum dos dois bloqueava `/deploy`. Seguem como backlog de melhoria.
- M2 (revogação de refresh token) e as demais notas 🟢/🟡 do `security-report.md` que já eram "backlog priorizado, não bloqueante" continuam como estavam.

### Conclusão da rodada 2

Reexecutei a suíte de teste de forma independente (101/101 passando), confirmei por leitura de código — não só pelo relato do dev-senior — que as 3 correções pré-requisito de `/deploy` (FK/cascade, A1, A2) e as 3 correções de fidelidade visual estão genuinamente aplicadas e coerentes com o código ao redor, e rodei checks adicionais (typecheck, lint, build de produção de ambos os projetos) que confirmam que nada quebrou. As 14 histórias de usuário continuam passando (nenhuma regressão nos critérios de aceite). **Libero o `/deploy`.**

---

## 0. Pré-condição verificada antes de iniciar

Antes de escrever qualquer teste, li `code-review.md` e `security-report.md` e confirmei:

- **`code-review.md`**: nenhum item permanece com severidade que impeça o início do `/testar`. Existe 1 item 🔴 (`PUT /babas/:id/presenca` quebra por FK sem cascade) — o próprio review já classifica como *"não bloqueia o início da fase seguinte, mas bloqueia o `/deploy`"*. Segui a instrução da tarefa: escrevi um teste que reproduz esse bug (falha hoje, de propósito) em vez de ignorá-lo.
- **`security-report.md`**: **nenhum 🔴 crítico em aberto** — os dois achados que se qualificariam (`SameSite=Strict` cross-site e `COOKIE_SECRET` com default hardcoded) foram corrigidos pelo próprio auditor durante a fase `/seguranca`, e eu confirmei essa correção lendo `backend/src/controllers/auth.controller.ts` e `backend/src/lib/env.ts` diretamente (não apenas confiando no relatório) — ambas as correções estão de fato aplicadas no código. Dois achados 🟠 Alto (A1 — vazamento de PII em `GET /babas/:id/eventos`, A2 — `trust proxy` ausente) seguem em aberto, marcados pelo próprio relatório como *"não bloqueiam `/testar`, bloqueiam `/deploy`"*.

Conclusão: **não havia bloqueante para iniciar o `/testar`.** Segui em frente, e tratei o bug 🔴 do code review e os 2 achados 🟠 do security report como itens a reproduzir com teste automatizado e reportar — não a corrigir eu mesmo (não sou responsável por código de produção nesta fase) e não a ignorar.

Também reconfirmei por leitura direta do código (não apenas pelos relatórios) que, na data desta auditoria de QA:
- `backend/src/repositories/gameEvents.repository.ts:8` **ainda** usa `include: { socio: true, convidado: true }` completo em `findByBabaId` → A1 **ainda aberto**.
- `backend/src/app.ts` **ainda** não chama `app.set('trust proxy', ...)` → A2 **ainda aberto**.
- `backend/prisma/schema.prisma` **ainda** não define `onDelete: Cascade` em `TeamMember.presencaId`/`GameEvent.presencaId` → 🔴 #1 do code review **ainda aberto**.

---

## 1. Resumo executivo

> **Nota:** esta seção 1 (e as seções 2–7) descrevem o estado da **rodada 1** de `/testar`, no momento em que os 3 itens pré-requisito de `/deploy` ainda estavam abertos. Está mantida como registro histórico. O estado atual, após as correções do dev-senior e a re-verificação independente, está na seção **"Atualização (rodada 2)"** no topo do documento — **é essa seção que vale para a decisão de `/deploy`.**

- **101 testes automatizados** escritos e executados no backend (`backend/tests/`), via Vitest: **96 passando, 5 falhando — e as 5 falhas são intencionais**, escritas para reproduzir e documentar bugs reais conhecidos (ver seção 4). Nenhuma falha é "teste quebrado por engano". *(Rodada 2: as mesmas 101 rodam e as 5 antes intencionalmente vermelhas agora passam — ver atualização no topo.)*
- **15 arquivos de teste**: 12 unitários (lógica de negócio pura/services com repositórios mockados) + 3 de integração (pipeline HTTP real via `createApp()` + `fetch`, com repositórios/serviços mockados no limite apropriado).
- **Cobertura aproximada** (qualitativa — não há ferramenta de cobertura de código configurada no projeto, `@vitest/coverage-v8` não está instalado e eu optei por não instalar uma dependência nova nesta fase sem necessidade clara; a análise abaixo é por inspeção manual de quais arquivos-fonte têm teste direto):
  - **Cobertos por teste dedicado**: `socioStatus.service`, `balance.service`, `suspension.service`, `inadimplencia.service`, `pix.service` + `lib/pix/emv`, `mensalidades.service`, `sorteio.service`, `rankings.service`, `me.service`, `prestacoes.service`, `despesas.service`, `auth.service` (via HTTP), `presencas.repository` (cenário de bug), autorização por papel/ownership de ~10 rotas (`socios`, `inadimplencia`, `me/*`, `babas/:id/eventos`, `prestacoes`, `pix`).
  - **Não cobertos por teste automatizado nesta rodada** (rastreados por leitura de código, não por teste): `convidados.service`, `pagamentosConvidados.service`, `categorias.service`, `config.service`, `dashboard.service`, `otherRevenues.service`, `audit.service`, geração real de PDF via Puppeteer (mockada nos testes, não exercitada de ponta a ponta — ver nota no item US8), upload real de arquivo para o Supabase Storage. Nenhum desses é um dos "4 cálculos sutis" indicados como prioridade pela tarefa, mas registro a lacuna para o backlog de testes.
- **E2E**: **não executados via Playwright.** Decisão justificada na seção 3.
- **Fidelidade visual**: comparação de código-fonte (JSX vs. HTML) de 8 telas (login, home do sócio, pagar mensalidade, inadimplência, suspensões, gols/cartões, e as 2 já citadas pelo code review). Alta fidelidade geral, com as mesmas divergências pontuais já registradas no `code-review.md` (não corrigidas ainda nesta rodada 1) mais 1 divergência nova de menor severidade (ver seção 5). *(Rodada 2: as 3 divergências relevantes foram corrigidas e reverificadas — ver atualização no topo.)*
- **Veredito das 14 histórias de usuário**: **14 de 14 PASSAM** os critérios de aceite em Gherkin (ver tabela na seção 2). *(Confirmado novamente na rodada 2, sem regressão.)*
- **Veredito da rodada 1: NÃO LIBERAR `/deploy` AINDA.** Apesar de todos os critérios de aceite passarem e não haver 🔴 crítico de segurança em aberto, seguindo a própria orientação explícita do `code-review.md` e do `security-report.md` (reforçada pela tarefa que originou este QA), havia **3 itens que são pré-requisito conhecido para produção** ainda abertos, cada um com um teste automatizado que os reproduzia: o bug de FK/cascade 🔴 (code review), o vazamento de PII 🟠 A1 e o `trust proxy` ausente 🟠 A2 (security report). **Rodada 2: os 3 itens foram corrigidos e reverificados de forma independente — `/deploy` LIBERADO.** Ver seção "Atualização" no topo.

---

## 2. Cobertura por critério de aceite (14 histórias de usuário)

| # | História | Critérios de aceite (Gherkin) | Evidência (testes) | Veredito |
|---|---|---|---|---|
| US1 | Login por papel | Sócio → Home do Sócio; Diretor → Dashboard; senha errada → erro, permanece no Login | `tests/integration/auth.spec.ts` (6 testes: sócio/diretor logam e recebem o `role` correto; senha errada e e-mail inexistente recebem a mesma mensagem genérica 401; usuário inativo não loga; payload inválido 422); leitura de `frontend/app/(auth)/login/page.tsx` confirma o redirect condicional por `role` e que o erro mantém o usuário na tela (não navega) | **PASSA** |
| US2 | Consultar situação financeira | Sem lançamento no mês → "inadimplente"; com lançamento → "em dia" | `tests/unit/me.service.spec.ts` (`getSituacao`: sem pagamento → `emDia=false`; com pagamento → `emDia=true`); `tests/integration/authorization.spec.ts` confirma que `/me/situacao` sempre resolve o sócio pelo JWT | **PASSA** |
| US3 | Pagar via Pix | Tela mostra QR Code e Pix copia-e-cola; sem confirmação do diretor, sócio continua "inadimplente" | `tests/unit/emv.spec.ts` + `tests/unit/pix.service.spec.ts` (payload EMV válido, CRC16 correto, chave/valor presentes); `tests/integration/authorization.spec.ts` confirma que `GET /pix/payload` é acessível ao sócio; não existe fluxo de confirmação automática no backend (só `POST /mensalidades` pelo diretor), logo o sócio trivialmente continua "inadimplente" até isso acontecer — confirmado por leitura de `mensalidades.service.ts`/`me.service.ts` | **PASSA** (com 1 bug cosmético novo e 1 nota de fidelidade — ver seções 4 e 5; nenhum dos dois invalida o critério de aceite em si) |
| US4 | Lançar pagamento de mensalidade | Lançamento salvo → status "em dia"; sem valor customizado → usa padrão R$110 | `tests/unit/mensalidades.service.spec.ts` (5 testes: valor customizado respeitado; valor padrão aplicado quando omitido; saldo recalculado; duplicidade rejeitada 409; sócio inexistente 404); `tests/integration/authorization.spec.ts` confirma 403 para sócio tentando lançar | **PASSA** |
| US5 | Sócio em DM não é cobrado por padrão | DM não aparece como inadimplente mesmo sem lançamento; diretor pode sobrepor (lançar mesmo assim) | `tests/unit/inadimplencia.service.spec.ts` e `tests/unit/me.service.spec.ts` (DM nunca aparece como inadimplente, em ambos os pontos onde a regra é aplicada); leitura de `mensalidades.service.ts` confirma que `create` não bloqueia por status (override sempre aceito) | **PASSA** |
| US6 | Lançar despesa semanal com comprovante | Semana + categoria + valor + anexo salvos; anexo disponível depois | `tests/unit/despesas.service.spec.ts` (4 testes: com anexo, sem anexo — RF16 é "deve poder", não obrigatório —, categoria inexistente rejeitada, saldo recalculado) | **PASSA** |
| US7 | Ver saldo acumulado | Saldo anterior −R$184,01 + receita R$500 − despesa R$300 = R$15,99 | `tests/unit/balance.service.spec.ts` — **o exemplo numérico exato do Gherkin foi usado como teste** e passa; cascata para meses futuros já fechados também testada | **PASSA** |
| US8 | Gerar Prestação de Contas em PDF | PDF com receitas, despesas por categoria/semana, totais e saldo | `tests/unit/prestacoes.service.spec.ts` (5 testes: snapshot usa saldo materializado, agrupamento por categoria correto, soma de receitas correta, geração bloqueia duplicidade de mês). **Nota de escopo**: a geração real do PDF (`generatePdfFromHtml`, via Puppeteer) foi mockada — o Chromium não está disponível neste ambiente de QA (mesma limitação já registrada pelo dev-senior e revisada no code-review/ADR-06). A montagem dos dados que vão para o PDF foi validada; a renderização visual do PDF em si não foi | **PASSA** (com ressalva de escopo documentada) |
| US9 | Sócio consulta prestação de contas | Sócio vê lista de meses e pode abrir/baixar PDF | `tests/integration/authorization.spec.ts` (`GET /prestacoes` e `GET /prestacoes/:month/pdf` acessíveis ao sócio; `preview`/`POST` corretamente exclusivos do diretor, 403 para sócio) | **PASSA** |
| US10 | Criar baba do dia e sortear times | 28 presentes → 4 times de 1 goleiro + 6 linha; ajuste manual salvo | `tests/unit/sorteio.service.spec.ts` (5 testes: distribuição exata 1+6 por time com 28 presentes; nenhum presente duplicado/perdido; erro de domínio sem presença; ajuste manual via `saveManual`) | **PASSA** |
| US11 | Cartão vermelho → suspensão automática | Cartão vermelho no baba N bloqueia inclusão no baba N+1, exceto override manual | `tests/unit/suspension.service.spec.ts` (5 testes, incluindo liberação/override) + `tests/unit/me.service.spec.ts` (`getProximoBaba` reflete `apto=false` quando suspenso) + leitura de `presenca.service.ts` (`setPresenca` rejeita com 409 participante suspenso antes de gravar) + `frontend/app/(diretor)/suspensoes/page.tsx` e `frontend/app/(socio)/inicio/page.tsx` exibem o estado corretamente | **PASSA** (nota: o bug 🔴 de FK/cascade, seção 4, afeta um cenário *adjacente* — reeditar a presença do **mesmo** baba depois que ele já teve sorteio/eventos — não afeta este critério de aceite, que é sobre o baba **seguinte**) |
| US12 | Cartão azul (sem suspensão) | Cartão azul não gera suspensão; jogador segue sorteável | `tests/unit/suspension.service.spec.ts` ("cartão azul... não fica suspenso") + leitura de `gameEvents.service.ts` (só `CARTAO_VERMELHO` cria `Suspension`) | **PASSA** |
| US13 | Ver rankings da temporada | Ranking de artilheiros por ano, com opção de trocar para cartões/presença | `tests/unit/rankings.service.spec.ts` (5 testes: ordenação de artilheiros, RF9 — convidado sem sócio nunca aparece —, contagem de cartões por tipo, percentual de presença sobre total de babas, filtro por ano civil/RF35) | **PASSA** |
| US14 | Visão geral de inadimplência (diretor) | Lista de sócios sem lançamento no mês, com ação de marcar "cobrado" | `tests/unit/inadimplencia.service.spec.ts` (7 testes) + `tests/integration/authorization.spec.ts` (403 para sócio, 200 para diretor) | **PASSA** (fidelidade parcial já registrada pelo code review — 🟡 #7, ainda não corrigida, ver seção 5) |

**Resultado: 14 de 14 histórias de usuário passam nos critérios de aceite descritos no PRD.**

---

## 3. Sobre a ausência de testes E2E via Playwright

Playwright não está instalado no projeto e não há banco de dados de teste (Postgres) disponível neste ambiente de QA (sem Docker, sem `psql`, sem `docker-compose` em `database/`, e `backend/prisma` não tem pasta `migrations/` — o schema foi aplicado via `db push`, não há como subir um banco efêmero e popular via migration). Instalar o Playwright agora exigiria baixar browsers binários (rede) e ainda não resolveria o problema do banco — os testes E2E precisariam de um backend real rodando contra dados reais para serem úteis, não apenas mocks.

Diante disso, para os fluxos críticos, usei o nível de teste mais alto viável no tempo disponível **sem inventar infraestrutura que o projeto não tem**:
- **Testes de integração HTTP reais** (`tests/integration/*.spec.ts`): sobem o `createApp()` de produção de verdade, em uma porta efêmera, e batem via `fetch` real — exercitando 100% do pipeline de middlewares (`helmet`, `cors`, rate limit, `authMiddleware`, `requireRole`, `requireOwnerOrDirector`, controllers, `errorHandlerMiddleware`) exatamente como em produção. Só a camada de repositório/Prisma é substituída (por mock ou por um fake in-memory), porque não há Postgres disponível.
- **Verificação de fluxo por leitura de código** (não é um teste automatizado, é rastreamento manual, registrado explicitamente como tal em cada história da tabela acima) para a parte que só existe no frontend (redirecionamento pós-login, exibição condicional de UI).

Registro esta lacuna explicitamente: **`/deploy` não deveria ser considerado "verificado em produção" só com este QA** — recomendo que, antes ou logo depois do primeiro deploy real, alguém rode manualmente (ou configure Playwright + um banco de staging) os 4 fluxos citados pela tarefa: login, sócio pagando via Pix, diretor lançando mensalidade/despesa, e o baba do dia completo (presença → sorteio → gols/cartões → suspensão aparecendo em Suspensões). A lógica de cada etapa individual está testada (unitária + integração); o que não está testado é a **jornada contínua** em um browser real.

---

## 4. Bugs encontrados

> **Status na rodada 2**: os itens #1, #2, #3 e #4 abaixo foram **corrigidos e reverificados de forma independente** (código lido diretamente + teste correspondente voltou a passar sem enfraquecer a asserção original — detalhes na seção "Atualização" no topo). Os itens #5 e #6 seguem em aberto como backlog de baixa severidade, não bloqueante.

### 🔴 #1 (herdado do code-review.md) — `PUT /babas/:id/presenca` quebra com erro 500 ao reeditar presença de um baba que já tem times/eventos — ✅ CORRIGIDO (rodada 2)

- **Reproduzido em**: `backend/tests/integration/presenca-fk-cascade.spec.ts` (2 testes, ambos falham hoje de propósito).
- **Passos**: baba tem uma `Presenca` já vinculada a um `TeamMember` (sorteio já rodou) ou a um `GameEvent` (gol/cartão já registrado). Diretor chama `PUT /babas/:id/presenca` para reeditar a lista (ex.: incluir um jogador atrasado).
- **Esperado**: a edição deveria ser aceita (ou falhar com um erro de domínio tratado, nunca um 500).
- **Obtido**: `presencasRepository.replaceAll` faz `deleteMany` das presenças antigas antes de recriar; como `TeamMember.presencaId`/`GameEvent.presencaId` são relações obrigatórias sem `onDelete: Cascade`, o Postgres (via Prisma) rejeita o DELETE com violação de FK (P2003), e isso sobe como erro 500 genérico ao cliente.
- **Ambiente de reprodução**: não há Postgres disponível neste QA; o teste usa um fake Prisma (`tests/helpers/fakePrisma.ts`) que implementa fielmente a semântica `RESTRICT` padrão do Postgres/Prisma para uma FK obrigatória sem cascade — o código exercitado (`presencasRepository`, real, sem alteração) é o mesmo de produção.
- **Severidade: 🔴 Alta (funcional/disponibilidade).** Não é uma falha de segurança, mas quebra um fluxo real e comum (corrigir presença depois que o jogo já começou).
- **Ação**: já documentada e endereçada ao dev-senior pelo code-review; **é pré-requisito para `/deploy`** — não deve ser reaberto, apenas corrigido antes de liberar produção.
- **✅ Correção verificada (rodada 2)**: `TeamMember.presenca`/`GameEvent.presenca`/`Suspension.originEvent` agora têm `onDelete: Cascade` no schema, e `presencasRepository.replaceAll` também apaga explicitamente (mesma transação, ordem `Suspension → GameEvent/TeamMember → Presenca`) antes de recriar, com `AuditLog` quando há perda de dado (`presenca.replace_com_perda_de_dados`). Os 2 testes de `presenca-fk-cascade.spec.ts` (asserções originais, inalteradas) passam.

### 🟠 #2 (herdado do security-report.md, A1) — vazamento de PII (e-mail/telefone) em `GET /babas/:id/eventos` para qualquer sócio autenticado — ✅ CORRIGIDO (rodada 2)

- **Reproduzido em**: `backend/tests/integration/authorization.spec.ts`, describe "A1 (security-report.md, Alto)".
- **Passos**: sócio comum (não diretor, não dono do dado) faz `GET /api/babas/:id/eventos` de um baba que já teve gols/cartões registrados para outro sócio.
- **Esperado**: a resposta não deveria conter e-mail/telefone de terceiros.
- **Obtido**: a resposta inclui `presenca.socio.email` e `presenca.socio.phone` (e o mesmo valeria para `convidado.phone`), porque `gameEventsRepository.findByBabaId` usa `include: { socio: true, convidado: true }` completo, e nem o service nem o controller filtram o resultado antes de devolvê-lo.
- **Severidade: 🟠 Alta (privacidade/LGPD — quebra de minimização de dados, OWASP API3:2023).**
- **Ação**: pré-requisito para `/deploy`, conforme o próprio `security-report.md`.
- **✅ Correção verificada (rodada 2)**: `gameEvents.repository.ts`, `presencas.repository.ts`, `babas.repository.ts` e `teams.repository.ts` agora usam `select: { id, name }` em vez de `include` completo para sócio/convidado. O teste de `authorization.spec.ts` (describe "A1", asserção `not.toContain('bruno@example.com')`, inalterada) passa.

### 🟠 #3 (herdado do security-report.md, A2) — `trust proxy` ausente, rate limiting por IP ineficaz atrás do Render — ✅ CORRIGIDO (rodada 2)

- **Verificado por**: leitura direta de `backend/src/app.ts` — não há `app.set('trust proxy', ...)` em nenhum lugar do arquivo (nem do restante de `backend/src`). Não escrevi um teste automatizado para isso porque o comportamento só se manifesta atrás de um proxy reverso real (`X-Forwarded-For`) — não é replicável de forma significativa com `fetch` local sem simular o proxy do Render, e simular isso adicionaria uma complexidade desproporcional ao valor do teste (o achado já está claramente localizado e a correção é uma linha).
- **Impacto**: em produção (atrás do proxy do Render), todas as requisições compartilham o mesmo "IP" percebido pelo `express-rate-limit`, permitindo que uma pessoa errando a senha 10 vezes bloqueie o login de todos os outros sócios por 15 minutos (DoS trivial), e tornando o `authRateLimiter` inútil como proteção de força bruta.
- **Severidade: 🟠 Alta (disponibilidade + proteção de autenticação).**
- **Ação**: pré-requisito para `/deploy`, conforme o próprio `security-report.md`. Correção é `app.set('trust proxy', 1)` em `createApp()`.
- **✅ Correção verificada (rodada 2)**: `backend/src/app.ts` agora chama `app.set('trust proxy', env.TRUST_PROXY_HOPS)`, com `TRUST_PROXY_HOPS` definido em `env.ts` (default `1`). Confirmado por leitura direta do código (item sem teste automatizado, conforme justificado abaixo).

### 🟡 #4 (novo, encontrado por este QA) — descrição do Pix é truncada em 25 caracteres, perdendo o ano da mensalidade — ✅ CORRIGIDO (rodada 2)

- **Reproduzido em**: `backend/tests/unit/emv.spec.ts` (teste `[BUG conhecido]`) e `backend/tests/unit/pix.service.spec.ts` (idem).
- **Passos**: sócio abre "Pagar Mensalidade" em qualquer mês cujo texto "Mensalidade Kalibaba M/AAAA" ultrapasse 25 caracteres (ex.: agosto/2026 → "Mensalidade Kalibaba 8/2026", 27 caracteres).
- **Esperado**: a descrição completa (com o ano de 4 dígitos) apareceria no app do banco do sócio ao escanear o QR Code/copiar o código.
- **Obtido**: `backend/src/lib/pix/emv.ts` reaproveita a função `normalize()` — pensada para os campos de **nome do beneficiário/cidade** (limite real de 25 caracteres no BR Code) — também para a **descrição** (campo 02, sem esse limite no manual do Bacen), truncando "Mensalidade Kalibaba 8/2026" para "MENSALIDADE KALIBABA 8/20". O valor cobrado e a chave Pix **não são afetados** — é só a descrição textual que o sócio vê no app do banco.
- **Severidade: 🟡 Média (cosmético/confuso para o usuário, não afeta valor cobrado nem segurança).** Não bloqueia `/deploy`, mas recomendo corrigir por ser barato: usar uma função de normalização separada (sem `.slice(0,25)`) para a descrição, ou aceitar até ~99 caracteres conforme o manual do Bacen.
- **✅ Correção verificada (rodada 2)**: `emv.ts` agora separa `MERCHANT_FIELD_MAX_LENGTH = 25` (nome/cidade) de `TLV_VALUE_MAX_LENGTH = 99` (descrição, via nova função `normalizeDescription`). Os testes `[BUG conhecido]` de `emv.spec.ts` e `pix.service.spec.ts` (asserções originais, inalteradas) passam.

### 🟢 #5 (observação, não é bem um "bug") — segue em aberto, não bloqueante — sorteio de times não fica perfeitamente equilibrado quando o nº de presentes não é múltiplo de 4 e a proporção goleiro/linha é desigual

- **Reproduzido em**: `backend/tests/unit/sorteio.service.spec.ts` (teste "distribuição desbalanceada").
- **Detalhe**: `sorteioService.sortear` distribui goleiros e jogadores de linha em dois round-robins **independentes**. Em cenários fora do "caso ideal" de 28 presentes (ex.: 2 goleiros + 15 de linha), os times que "ganham" um goleiro extra do round-robin de goleiros também tendem a "ganhar" um de linha a mais no round-robin de linha, e a diferença entre o time mais cheio e o mais vazio pode chegar a 2 jogadores, não a 1 como o comentário do código sugere ("a distribuição fica o mais equilibrada possível"). Ninguém é perdido ou duplicado — é só um desequilíbrio pequeno, corrigível manualmente pelo diretor (RF27 já prevê ajuste manual).
- **Severidade: 🟢 Baixa (o próprio RF27 já provê o escape — ajuste manual).** Não bloqueia nada; registro como sugestão de melhoria futura (round-robin único combinando as duas filas, ou balanceamento pelo tamanho atual do time).

### 🟢 #6 (fidelidade, novo) — tela "Pagar Mensalidade" do sócio nunca mostra o estado "pagamento confirmado" do protótipo — ✅ CORRIGIDO (rodada 2)

- **Prototipo**: `prototipo/pagar-mensalidade.html` define dois estados visuais (`#view-pending` e `#view-confirmed`, com um simulador de alternância).
- **Implementação (rodada 1)**: `frontend/app/(socio)/pagar/page.tsx` só busca o payload Pix e exibe QR/copia-e-cola; nunca consulta se a mensalidade do mês já foi confirmada, então um sócio que já pagou (e navega para `/pagar` de novo) veria o mesmo QR Code, sem nenhuma indicação de que já está em dia (essa indicação só existia na Home). Não era uma falha do critério de aceite de US3 (que não exige esse segundo estado explicitamente), mas era uma tela do protótipo aprovado que não tinha sido replicada.
- **Severidade: 🟢 Baixa.**
- **✅ Correção verificada (rodada 2)**: a página agora chama `financeiroService.getSituacao()` e, quando `emDia && payment`, renderiza o estado "Pagamento confirmado!" com mês/valor/data — igual ao 2º estado do protótipo. Confirmado por leitura do código-fonte atual de `frontend/app/(socio)/pagar/page.tsx`.

---

## 5. Fidelidade visual ao protótipo

Comparei o JSX renderizado (lendo o código-fonte de `frontend/app/**/page.tsx`) contra o HTML de `prototipo/*.html` correspondente, em 8 telas — as 3 já citadas pelo code review (para confirmar se seguem abertas) mais 5 novas:

| Tela | Resultado |
|---|---|
| `login.html` vs `(auth)/login/page.tsx` | **Fidelidade muito alta** — tradução praticamente 1:1 (mesma paleta navy/teal/sun, mesmo layout hero+form, mesmos ícones, mesmo texto) |
| `pagar-mensalidade.html` vs `(socio)/pagar/page.tsx` | Rodada 1: faltava o 2º estado visual "pagamento confirmado". **Rodada 2 (reverificado): corrigido** — a página agora consulta `/me/situacao` e mostra o estado "Pagamento confirmado!" quando aplicável, igual ao protótipo (🟢 #6) |
| `home-socio.html` vs `(socio)/inicio/page.tsx` | Rodada 1: só 2 cards. **Rodada 2 (reverificado): corrigido** — grid com 3 cards (Sócios ativos / Adimplência / Inadimplência), igual ao protótipo (🟢 #11 do code review) |
| `inadimplencia.html` vs `(diretor)/inadimplencia/page.tsx` | Rodada 1: faltavam colunas/cards. **Rodada 2 (reverificado): corrigido** — tabela com Telefone/Dias em aberto/Valor devido e cards "Valor total em aberto"/"Taxa de inadimplência", igual ao protótipo (🟡 #7 do code review). Toggle "Cobrado?" client-only continua como dívida técnica aceita, não bloqueante |
| `suspensoes.html` vs `(diretor)/suspensoes/page.tsx` | Fidelidade alta — cards de resumo, lista de suspensões ativas, histórico e botão de override manual todos presentes e com a mesma linguagem visual |
| `gols-cartoes.html` vs `(diretor)/gols-cartoes/page.tsx` | A implementação vira um atalho que redireciona para `/baba-dia/:id/eventos` (o baba mais recente) em vez de uma tela própria — funcionalmente razoável (evita duplicar UI), mas é uma divergência estrutural do protótipo que vale documentar como decisão consciente, não um erro |
| `dashboard-financeiro.html` vs `(diretor)/dashboard/page.tsx` | Não abri o código a fundo nesta rodada (fora da amostra por tempo); code review já validou esta tela com o dev, sem apontamento. Não encontrei motivo para reabrir |
| `situacao-financeira.html` vs `(socio)/financeiro/page.tsx` | Idem — não reaberto nesta rodada, sem apontamento anterior |

**Conclusão de fidelidade (rodada 1)**: consistente com o `code-review.md` — a fidelidade geral é alta, os desvios são pontuais e já estavam catalogados (não pioraram, não foram corrigidos ainda), mais 2 divergências novas de severidade baixa encontradas por este QA (🟢 #5 e 🟢 #6). Nenhuma delas invalida um critério de aceite do PRD.

**Conclusão de fidelidade (rodada 2, reverificada)**: as 3 divergências relevantes (Home do Sócio, Inadimplência, Pagar Mensalidade) foram corrigidas e eu confirmei cada uma comparando o código-fonte atual com o HTML do protótipo correspondente, linha a linha. O item 🟢 #5 (sorteio) e a nota estrutural sobre `gols-cartoes` não foram mencionados como alterados e seguem como estavam — nenhum dos dois jamais bloqueou nada.

---

## 6. Recomendação final

> Esta seção reflete a decisão da **rodada 1** (histórico). A decisão vigente está na seção "Atualização (rodada 2)" no topo do documento: **`/deploy` LIBERADO.**

**(Rodada 1) Não recomendo `/deploy` ainda.** Todos os 14 critérios de aceite passam e não há 🔴 crítico de segurança em aberto — mas três itens que os próprios `code-review.md` e `security-report.md` marcaram como **pré-requisito conhecido para produção** continuam sem correção, e cada um tem hoje um teste automatizado que os reproduz (ficarão vermelhos até serem corrigidos — é esperado, não é regressão):

**Devolver ao `dev-senior` para corrigir, antes do `/deploy`:**
1. **🔴 FK/cascade em `PUT /babas/:id/presenca`** (code-review.md #1) — teste: `backend/tests/integration/presenca-fk-cascade.spec.ts`.
2. **🟠 A1 — vazamento de PII em `GET /babas/:id/eventos`** (security-report.md) — teste: `backend/tests/integration/authorization.spec.ts` (describe "A1").
3. **🟠 A2 — `trust proxy` ausente** (security-report.md) — sem teste automatizado (ver justificativa na seção 4); verificação: `app.set('trust proxy', 1)` deve existir em `backend/src/app.ts`.

**Recomendado corrigir junto (barato, mesmo padrão de código do item 2, já apontado pelo próprio security-report M1):** validação de mimetype real (magic bytes) em `backend/src/middlewares/upload.middleware.ts`, hoje ainda só valida o `Content-Type` declarado pelo cliente.

**Opcional, mas de baixo custo (achado novo deste QA):** corrigir a truncagem da descrição do Pix (🟡 #4) em `backend/src/lib/pix/emv.ts`.

**Depois dessas correções**, não é necessário refazer todo o `/testar` — basta rodar de novo os 3 arquivos de teste que hoje falham de propósito (`npx vitest run tests/integration/presenca-fk-cascade.spec.ts tests/integration/authorization.spec.ts tests/unit/emv.spec.ts tests/unit/pix.service.spec.ts`) e confirmar que passam a ficar verdes; isso, junto da confirmação de que `A2` foi de fato aplicado, libera o `/deploy`.

### Como rodar a suíte

```bash
cd backend
npm test                 # vitest run — 15 arquivos, 101 testes (todos passando na rodada 2)
```

---

## 7. Recomendação final (rodada 2 — vigente)

**`/deploy` LIBERADO.**

Critérios verificados de forma independente nesta rodada:
- ✅ As 14 histórias de usuário (seção 2) continuam passando — nenhuma regressão introduzida pelas correções.
- ✅ Nenhum 🔴 crítico de segurança em aberto (reconfirmado — nada novo desde `security-report.md`).
- ✅ Os 3 itens pré-requisito de produção (🔴 FK/cascade, 🟠 A1, 🟠 A2) estão corrigidos, verificados por leitura de código de produção e por teste automatizado (não apenas pelo relato do dev-senior).
- ✅ O achado 🟡 #4 (truncamento da descrição do Pix, encontrado por este QA) e a violação de camada 🟡 #3 do code review (`rankings.service.ts` importando Prisma) também foram corrigidos e verificados.
- ✅ As 3 divergências de fidelidade visual relevantes (Home do Sócio, Inadimplência, Pagar Mensalidade) foram corrigidas e reverificadas contra os protótipos.
- ✅ `tsc --noEmit` limpo em `backend/` e `frontend/`; `eslint` limpo em `backend/`; build de produção bem-sucedido em `backend/` (tsc → `dist/`) e `frontend/` (`next build`, 29 rotas).
- ✅ Suíte de testes rodada de forma independente: **101/101 passando**.

Pendências remanescentes (não bloqueiam este deploy, registradas como backlog):
- 🟡 M1 (security-report.md) — validação de mimetype real (magic bytes) em uploads de comprovante, ainda não implementada.
- 🟢 #5 — pequeno desbalanceamento do sorteio de times em cenários fora do "ideal" de 28 presentes (o próprio RF27 já provê ajuste manual como escape).
- Nota estrutural sobre `gols-cartoes` virar um redirect em vez de tela própria — decisão de implementação razoável, não um defeito.
- Lacunas de cobertura de teste automatizado listadas na seção 1 (`convidados.service`, `categorias.service`, `dashboard.service`, geração real de PDF via Puppeteer, upload real ao Supabase Storage) e ausência de testes E2E via Playwright (seção 3) — recomendo, como já registrado, validar manualmente (ou com Playwright + banco de staging) os 4 fluxos críticos citados na seção 3 antes ou logo depois do primeiro deploy real em produção.

**Próximo passo recomendado: seguir para `/deploy`.**

---

## 8. Arquivos de teste criados

> Nota (rodada 2): `tests/helpers/fakePrisma.ts` foi estendido pelo dev-senior (suporte a `teamMember.deleteMany`, `gameEvent.deleteMany` e a um novo model `suspension`, com matching de filtros aninhados) para acomodar a correção real do bug 🔴 #1, que passou a apagar esses vínculos explicitamente antes de recriar a presença. As asserções de teste em si (o que define "comportamento correto") não foram alteradas — só a capacidade do fake de simular o banco ficou mais completa. Um novo teste de `inadimplencia.service.spec.ts` também foi ajustado para refletir o novo contrato de `getInadimplentes` (agora inclui telefone/valor/dias em aberto), com justificativa registrada no próprio teste — revisado e considerado legítimo (ver "Atualização" no topo).

```
backend/
├── vitest.config.ts
├── tests/
│   ├── setup.ts                              # env determinístico (JWT secrets, NODE_ENV=test, etc.)
│   ├── helpers/
│   │   ├── fakePrisma.ts                     # fake in-memory do Prisma p/ reproduzir FK RESTRICT (+ cascata explícita)
│   │   ├── testServer.ts                     # sobe createApp() real em porta efêmera p/ fetch
│   │   └── tokens.ts                         # gera JWTs de teste (diretor/sócio)
│   ├── unit/
│   │   ├── emv.spec.ts
│   │   ├── socioStatus.service.spec.ts       # ADR-02 (carry-forward)
│   │   ├── balance.service.spec.ts           # ADR-03 (saldo acumulado em cascata)
│   │   ├── suspension.service.spec.ts        # ADR-04 (suspensão computável)
│   │   ├── inadimplencia.service.spec.ts     # RF12/RNF8
│   │   ├── pix.service.spec.ts               # ADR-05
│   │   ├── mensalidades.service.spec.ts
│   │   ├── sorteio.service.spec.ts
│   │   ├── rankings.service.spec.ts
│   │   ├── me.service.spec.ts
│   │   ├── prestacoes.service.spec.ts
│   │   └── despesas.service.spec.ts
│   └── integration/
│       ├── auth.spec.ts
│       ├── authorization.spec.ts             # RBAC, IDOR, A1
│       └── presenca-fk-cascade.spec.ts       # bug 🔴 #1
```
