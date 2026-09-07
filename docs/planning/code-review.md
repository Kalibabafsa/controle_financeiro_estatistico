# Code Review — Sistema Kalibaba

> Gerado pela fase `/revisar`, a partir de `docs/planning/prd.md`, `docs/planning/architecture.md`, `docs/design-system.md`, protótipos em `prototipo/` e `docs/convencoes.md`. Revisão de `backend/` e `frontend/` produzidos pelo `/desenvolver`.

## Veredito

**Aprovado com ressalvas.** A implementação é sólida, fiel às regras de negócio mais delicadas do PRD (histórico mensal de status com carry-forward, inadimplência por ausência de lançamento, saldo acumulado materializado, suspensão computável a qualquer momento, isolamento do dado sensível DM) e majoritariamente fiel ao protótipo. Não encontrei nenhum achado que exija retorno obrigatório ao `dev-senior` antes de prosseguir — mas há **um bug de correção real** (item 🔴 #1) e uma **quebra funcional apontada pelo próprio ADR-01** (SameSite=Strict) que precisam entrar no plano de correção antes do `/deploy`, mesmo que não bloqueiem o início do `/seguranca`.

Recomendação: seguir para **`/seguranca`**, com os itens 🔴 e 🟡 abaixo registrados como pendências a corrigir antes do `/deploy` (alguns podem ser corrigidos em paralelo à auditoria de segurança, já que são de domínios diferentes).

---

## 🔴 Bloqueante

### 1. `PUT /api/babas/:id/presenca` quebra com erro 500 se já existem times/eventos para o baba
**Arquivo:** `backend/src/repositories/presencas.repository.ts:18-26` (`replaceAll`), schema em `backend/prisma/schema.prisma:272-295` (`TeamMember`, `GameEvent`).

`TeamMember.presencaId` e `GameEvent.presencaId` são relações **obrigatórias** (`presencaId String`, não `String?`) sem `onDelete: Cascade` explícito no schema. O default do Prisma para relação obrigatória é `Restrict` (Postgres/MySQL). Isso significa que `presencasRepository.replaceAll` — que faz `tx.presenca.deleteMany({ where: { babaDoDiaId } })` antes de recriar a lista — vai falhar com uma violação de FK (P2003) sempre que o diretor tentar **reeditar a lista de presença** de um baba que já teve sorteio de times (`POST /babas/:id/sorteio` ou `PUT /babas/:id/times`) ou eventos registrados (`POST /babas/:id/eventos`).

Esse é um fluxo real do dia a dia: jogador chega atrasado e precisa ser incluído na presença depois que o sorteio/eventos já começaram, ou o diretor corrige um erro de escalação após já ter batido um gol. Hoje isso derruba a requisição com um erro não tratado (o `errorHandler` vai devolver 500 genérico, sem mensagem de domínio).

**Correção sugerida:** ou (a) no `PUT /babas/:id/presenca`, apagar em cascata `GameEvent`/`TeamMember`/`Suspension.originEvent` vinculados às presenças removidas antes do `deleteMany` (dentro da mesma transação, com log de auditoria da perda de dados), ou (b) mudar a semântica do endpoint para "upsert incremental" (adiciona/remove participantes individualmente, preservando quem já tem evento/time), que é mais seguro para um sistema com histórico de eventos. A opção (b) é mais alinhada ao espírito de "nunca perder lançamento" do RNF5/RNF8. Qualquer que seja a escolha, também exige revisão de `teamsRepository.replaceAll` (mesma classe de risco: apaga `Team`/`TeamMember` do zero — aqui é intencional e ok pois `GameEvent.teamId` é opcional, mas vale confirmar que recriar o time não deixa `GameEvent.teamId` órfão apontando para um `Team` já deletado).

---

## 🟡 Importante

### 2. Cookie de refresh `SameSite=Strict` não funciona em front/back cross-site (ponto sinalizado pelo dev)
**Arquivo:** `backend/src/controllers/auth.controller.ts:10-18`.

Concordo com o alerta do dev: isso não é só um "pode quebrar", é uma quebra garantida. Vercel (`*.vercel.app` ou domínio próprio) e Render (`*.onrender.com`) são domínios registráveis diferentes — logo, toda chamada `fetch` do frontend para `/api/auth/refresh` é cross-site. `SameSite=Strict` bloqueia o envio do cookie em **qualquer** requisição cross-site, inclusive `fetch` com `credentials: 'include'` feito por JS da própria aplicação (diferente de `Lax`, que ao menos permite navegação top-level). Na prática, em produção, o refresh token nunca vai chegar ao backend — o usuário será deslogado a cada expiração do access token (15 min), 100% das vezes.

**Correção sugerida:** `SameSite=None; Secure` (já é `Secure` em produção) é o valor correto para cookies em requisições cross-site autenticadas via `fetch`. Isso não reabre superfície de CSRF relevante porque (conforme o próprio ADR-08/modelo de ameaças) as rotas de mutação usam o access token no header `Authorization`, não o cookie — o cookie de refresh só é lido por `POST /auth/refresh`, que não muda estado de negócio. Vale também considerar hospedar front/back sob o mesmo domínio registrável (ex.: `app.kalibaba.com` + `api.kalibaba.com`, ambos `*.kalibaba.com`) caso se queira manter `Strict` no futuro — mas isso é uma decisão de infraestrutura para o `/deploy`, não deste code review.

**Não bloqueia `/seguranca`** (o agente de segurança deve inclusive validar a troca para `SameSite=None`), mas **bloqueia `/deploy`** — sem essa correção o sistema não sustenta sessão em produção.

### 3. `rankings.service.ts` importa Prisma diretamente, violando a camada de repository
**Arquivo:** `backend/src/services/rankings.service.ts:1,77,81`.

Toda a arquitetura (e `docs/convencoes.md`, regra "não negociável": *"Repository é o único a importar o Prisma"*) foi respeitada em 100% dos outros services — exceto este. `rankingsService.get` (branch `presenca`) chama `prisma.presenca.findMany` e `prisma.babaDoDia.count` diretamente, quando já existem repositories (`presencasRepository`, `babasRepository`) que deveriam expor esses métodos.

**Correção sugerida:** extrair para `presencasRepository.findBySeason(season)` e `babasRepository.countBySeason(season)`, mantendo o service livre de import de `@prisma/client`/`lib/prisma`. Pequeno refactor, mas didaticamente importante — é exatamente o tipo de atalho que a regra de camadas existe para prevenir (troca de banco, teste unitário do service sem mockar Prisma, etc.).

### 4. `frontend/middleware.ts` não existe — proteção de rota é só client-side
**Arquivo esperado:** `frontend/middleware.ts` (especificado em `docs/planning/architecture.md`, seção 5.2: *"protege (socio)/(diretor) por role, redireciona não-autenticado"*). Implementado em vez disso: `frontend/lib/auth/RequireRole.tsx`, usado em `app/(diretor)/layout.tsx` e `app/(socio)/layout.tsx`.

O componente `RequireRole` é client-side (`'use client'`), depende de `useAuth()` resolver a sessão via `GET /api/me` após a hidratação, e só então decide renderizar ou redirecionar. Funcionalmente ele evita vazar conteúdo (mostra spinner até resolver), e o comentário no próprio arquivo é honesto sobre isso ("guarda de rota no client — só UX; autorização de verdade é sempre reforçada pelo backend") — então **não há brecha de segurança real**, já que todo endpoint valida papel/dono de novo. Mas é uma divergência explícita da arquitetura documentada, e tem custo de produto: toda rota protegida faz uma volta a mais (esperar `/api/me`) antes de decidir o que renderizar, o que é justamente o tipo de latência que o `middleware.ts` no edge evitaria (RNF3: dashboards < 2s).

**Correção sugerida:** implementar `frontend/middleware.ts` de fato, ou — se a equipe decidir conscientemente que o modelo de token em memória (ADR-01) inviabiliza checagem de role no middleware do Next (já que o middleware roda no edge sem acesso ao estado em memória do client), registrar essa decisão como um adendo ao ADR-01 em vez de deixá-la como uma omissão silenciosa. Uma alternativa que preserva "token de acesso nunca em storage persistente" e ainda permite checagem no edge é usar um cookie **não-sensível** só com o `role` (não o token) para o middleware decidir o redirect grosso, mantendo a validação fina sempre no backend.

### 5. Validação de mimetype de upload é só o valor declarado pelo cliente
**Arquivo:** `backend/src/middlewares/upload.middleware.ts:9-19`.

O modelo de ameaças da arquitetura (seção 7) promete: *"`upload.middleware.ts` valida mimetype real (não só extensão)"*. Na implementação, `file.mimetype` vem do multer a partir do cabeçalho `Content-Type` da parte multipart — que é **declarado pelo próprio cliente**, tão falsificável quanto a extensão do arquivo. Um atacante pode enviar um `.html`/`.js` malicioso com `Content-Type: image/png` e passar pela validação.

**Correção sugerida:** inspecionar os magic bytes reais do buffer (ex.: lib `file-type`) depois do upload em memória e antes de gravar no Supabase Storage, rejeitando se o conteúdo real não bater com um dos tipos permitidos. Isso é básico (crivo básico desta fase); recomendo que o `/seguranca` aprofunde (ex.: sanitização de nome de arquivo, scanning de malware se aplicável).

### 6. `COOKIE_SECRET` tem valor default hardcoded no schema de env
**Arquivo:** `backend/src/lib/env.ts:18`.

```ts
COOKIE_SECRET: z.string().min(8).default('dev-cookie-secret-change-me'),
```

O restante do arquivo segue disciplina de fail-fast (`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` são obrigatórios, sem default, e o processo recusa subir sem eles). `COOKIE_SECRET`, que assina o cookie de refresh (`cookieParser(env.COOKIE_SECRET)`), quebra esse padrão: se a variável não for configurada no Render por engano, o servidor sobe silenciosamente com um segredo público e previsível (está no código-fonte, versionado). Não é um segredo real vazado agora, mas é o tipo de "hardcoded fallback" que vira segredo real em produção por esquecimento.

**Correção sugerida:** remover o `.default(...)` e tornar `COOKIE_SECRET` obrigatório como os dois `JWT_*_SECRET`, ou (se quiser manter DX de dev fácil) só aplicar o default quando `NODE_ENV !== 'production'`.

### 7. Tela "Gestão de Inadimplência" tem fidelidade parcial ao protótipo (ponto sinalizado pelo dev, mas com detalhe adicional)
**Arquivos:** `frontend/app/(diretor)/inadimplencia/page.tsx` vs `prototipo/inadimplencia.html`.

Concordo com o dev que o toggle "Cobrado?" client-only é uma limitação de schema conhecida e aceitável como dívida técnica registrada (não há campo persistente para isso — criar um agora seria um requisito novo, não coberto pelo PRD/arquitetura atual). Mas a fidelidade visual vai um pouco além disso: o protótipo mostra colunas **Telefone**, **Dias em aberto** e **Valor devido**, além de cards de resumo com **"Valor total em aberto"** e **"Taxa de inadimplência"**. A implementação tem só **Sócio / Cobrado? / Ações**, e o card de resumo virou "Já cobrados (sessão)" — informação que não existe no protótipo e que reinicia a cada F5, um pouco confusa para o diretor.

Isso decorre de `inadimplenciaService.getInadimplentes` (`backend/src/services/inadimplencia.service.ts:29-34`) retornar só `{ id, name }`, sem telefone nem valor devido. Dá pra resolver com pouco esforço: telefone já está em `Socio.phone`; valor devido é o `defaultMonthlyFee` (ou o valor customizado, se algum dia existir por sócio) da config; "dias em aberto" pode ser calculado a partir do início do mês de referência.

**Não bloqueante**, mas registrar como item de fidelidade a resolver — ou formalmente aceitar o desvio e atualizar o protótipo/design-system para refletir a versão simplificada (em vez de deixar a divergência implícita).

### 8. N+1 de consultas no cálculo de status/inadimplência para listas grandes
**Arquivos:** `backend/src/services/inadimplencia.service.ts:17-23`, `backend/src/services/socios.service.ts:23-28`.

`resolveMonthSituation` e `sociosService.list` chamam `socioStatusService.getStatusForMonth` **por sócio**, em `Promise.all`, e cada chamada faz até 2 queries (`findExactMonth` + eventualmente `findMostRecentUpTo`). Para ~50 sócios isso é ~100 queries por carregamento do dashboard/inadimplência — funciona hoje, mas é exatamente o tipo de padrão que o RNF3 (dashboard < 2s) pode não perdoar conforme o histórico cresce (mais meses = mais chance de cair no caminho `findMostRecentUpTo`, que não tem cache).

**Correção sugerida (não urgente):** resolver o carry-forward em lote (uma query trazendo todo o histórico relevante — o método `socioStatusRepository.findAllUpTo` já existe em `socios.repository.ts:71-76` mas está **sem uso** — e resolver o carry-forward em memória, sócio a sócio, sem round-trip adicional por sócio). Também dá pra remover o método morto ou usá-lo, uma das duas coisas.

---

## 🟢 Sugestão

### 9. `void existingTeams;` — leitura descartada sem uso real
**Arquivo:** `backend/src/repositories/teams.repository.ts:20,32`.

`replaceAll` busca `existingTeams` e nunca usa o resultado além de silenciar o lint com `void existingTeams;`. Ou remove a query (economiza um round-trip por sorteio/ajuste manual) ou usa para algo (ex.: log de auditoria do estado anterior).

### 10. `setPresencaSchema`/`participantSchema` não valida consistência `type` × `socioId`/`convidadoId`
**Arquivo:** `backend/src/schemas/babas.schemas.ts:21-26`.

O schema aceita `{ type: 'SOCIO', convidadoId: '...' }` (sem `socioId`) sem erro de validação — a inconsistência só aparece depois, dentro do service, que silenciosamente usa `undefined` para os dois campos (`presenca.service.ts:33-34`), resultando em uma `Presenca` sem `socioId` nem `convidadoId`. Um `.refine()` no schema Zod pegaria isso na fronteira, como manda `docs/convencoes.md`.

### 11. "Resumo da associação" com 2 cards no lugar de 3 no protótipo
**Arquivos:** `frontend/app/(socio)/inicio/page.tsx:148-159` vs `prototipo/home-socio.html:233-249`.

O protótipo mostra 3 cards (`Sócios ativos`, `Adimplência %`, `Inadimplência %`); a implementação mostra 2 (faltando "Adimplência"). `SituacaoGeralResponse` (contrato do backend) também só retorna `percentualInadimplencia`, então a "adimplência" nem está disponível — mas é trivialmente derivável (`100 - inadimplência`) sem precisar mudar o backend. Pequeno, mas é um desvio visual real do protótipo aprovado.

### 12. Nenhum teste automatizado (ponto sinalizado pelo dev)
Concordo com o dev que isso é esperado nesta etapa e não é um problema de *qualidade de código* per se — mas é uma lacuna real frente a `docs/convencoes.md` (seção Testes: unitários de service, integração de endpoint incluindo autorização negada, e2e de fluxos críticos) e à regra de ouro #8 do `CLAUDE.md` ("Testes e segurança antes do deploy"). Não é bloqueante para o `/seguranca` prosseguir, mas é bloqueante para o `/deploy` — e vale já sinalizar prioridades pro `/testar`: os candidatos mais críticos para cobertura de integração são exatamente os pontos que este review tocou (autorização `ownership.middleware`, `SuspensionService.isSuspended`, `BalanceService.recalculateFrom` em cascata, e o bug do item 🔴 #1).

---

## Parecer sobre os 5 pontos sinalizados pelo Dev Sênior

1. **Cookie `SameSite=Strict` cross-site** — Concordo, é mais grave do que "pode quebrar": **vai quebrar** sempre, 100% das vezes, em produção com domínios Vercel/Render distintos. Ver 🟡 #2. Não bloqueia `/seguranca`, bloqueia `/deploy`.
2. **Puppeteer/Chromium não baixado nesta sessão dev** — Decisão e implementação corretas (`generatePdfFromHtml` falha com erro de domínio claro em vez de derrubar o processo; ADR-06 já documenta o risco de memória no Render). Ação necessária antes do `/deploy`: garantir que o build do Render realmente baixa o Chromium (ou usa um buildpack/imagem com Chromium do sistema) — hoje o `.npmrc`/`allowScripts` sugere que o *dev* pulou o download por conveniência local, então isso precisa ser revisto no pipeline de deploy, não no código em si. Não bloqueia `/seguranca`.
3. **Toggle "Cobrado?" só client-side** — Concordo que é uma limitação de schema aceitável para o MVP (não há requisito de persistir isso no PRD além de "controle interno"). Ver 🟡 #7 para o detalhe adicional de fidelidade visual que vale resolver junto. Não bloqueia nada.
4. **1 vulnerabilidade alta residual do `npm audit` (Next 15.5)** — Decisão consciente e razoável de não migrar para o Next 16 agora; isso é exatamente o tipo de achado que cabe ao `/seguranca` avaliar com mais profundidade (severidade real, exploitabilidade no contexto da aplicação) e decidir se aceita como risco residual documentado ou exige a migração. Não bloqueia o início do `/seguranca` — pelo contrário, é material de entrada para ele.
5. **Nenhum teste automatizado** — Ver 🟢 #12. Não bloqueia `/seguranca`, bloqueia `/deploy`.

---

## O que está bem feito (não é só uma lista de problemas)

- **Fidelidade às regras de negócio sutis do PRD/ADRs**: carry-forward de status mensal (ADR-02), saldo acumulado materializado e recalculado em cascata (ADR-03), suspensão por cartão vermelho como função pura sobre dado materializado (ADR-04), Pix via gateway abstrato sem chamar terceiros no MVP (ADR-05) — todos implementados exatamente como especificado, com comentários que remetem de volta ao ADR/RF correspondente.
- **Isolamento do dado sensível DM (RSP2)**: a observação de `SocioStatusMensal` nunca é serializada para quem não é diretor, em ambos os endpoints que a expõem (`GET /socios/:id`, `GET /socios/:id/status-history`), com padrão único de "serializer explícito" em vez de confiar em filtro no client.
- **RSP1/RSP3 (isolamento de dados financeiros entre sócios)**: `/me/*` (ADR-08) resolve o dono a partir do JWT em toda rota de autoatendimento; `ownership.middleware.ts` cobre as rotas com `:id`; `GET /situacao-geral` retorna só agregados, nunca a lista nominal (exclusiva de `GET /inadimplencia`, restrito a `DIRETOR`).
- **Camadas do backend**: controllers finos em praticamente 100% dos módulos (única exceção é o item 🟡 #3); nenhum controller acessa Prisma; toda escrita financeira/de futebol passa por `AuditLog` com metadata mínimo (nunca duplica PII, conforme RSP9).
- **Fidelidade visual ao protótipo**: nas telas comparadas em amostra (`login.html`, `home-socio.html`, `inadimplencia.html`), a paleta navy/teal/sun, tipografia (Poppins/Inter), componentes (cards arredondados, badges de status, EmptyState) e comportamento responsivo (grid mobile/desktop, drawer) foram reproduzidos com fidelidade alta — os desvios encontrados (🟡 #7, 🟢 #11) são pontuais, não sistêmicos.
- **Segredos**: nenhum segredo hardcoded encontrado em `backend/src` ou `frontend/` (grep dedicado por padrões comuns não retornou nada); `.env` nunca foi commitado (`git log` confirma); único ponto fraco é o *default* de `COOKIE_SECRET` (🟡 #6), não um segredo real vazado.

---

## Próximo passo

Recomendo seguir para **`/seguranca`** com esta lista de pendências já registrada. Sugestão de sequenciamento pro dev-senior (pode ser em paralelo à auditoria de segurança, já que não bloqueia a entrada nela):
1. Corrigir o bug de FK do item 🔴 #1 (é o único que pode gerar erro 500 real em uso normal do sistema).
2. Ajustar `SameSite=None; Secure` (🟡 #2) e remover o default de `COOKIE_SECRET` (🟡 #6) — o `/seguranca` vai revisar esses dois de qualquer forma, mas resolver agora evita retrabalho.
3. Extrair o acesso a Prisma de `rankings.service.ts` (🟡 #3) e reforçar a validação de mimetype real de upload (🟡 #5) — pequenos, mecânicos.
4. Registrar formalmente a decisão sobre `middleware.ts` (🟡 #4) — implementar ou documentar a divergência como adendo ao ADR-01.
5. Itens 🟢 e o restante dos 🟡 (fidelidade de inadimplência, N+1) podem virar backlog priorizado pelo `/testar`/`/deploy`.
