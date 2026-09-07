# Relatório de Segurança — Sistema Kalibaba

> Gerado pela fase `/seguranca`, a partir de `docs/seguranca.md` (baseline), `docs/planning/architecture.md` (modelo de ameaças), `docs/planning/prd.md` (RSP1–RSP9) e `docs/planning/code-review.md`. Auditoria de `backend/`, `frontend/` e `database/` (schema Prisma). **Atualizado com re-verificação pós-correção do dev-senior — ver seção 6.**

## 1. Resumo executivo

**Veredito (após re-verificação, seção 6): APROVADO — sem impedimento de segurança para `/deploy`.**

A implementação segue o baseline de segurança na grande maioria dos pontos: autenticação com bcrypt (12 rounds) e JWT de vida curta, autorização por papel **e por dono do recurso** checada no backend em todas as ~55 rotas revisadas, isolamento consistente do dado sensível DM (RSP2) e dos dados financeiros individuais (RSP3), Zod validando toda fronteira de entrada, `helmet` + CORS restrito + rate limiting presentes, nenhum segredo versionado, uploads com limite de tamanho e allowlist de mimetype, buckets de storage privados com URL assinada.

Dois achados que o `code-review.md` já havia sinalizado como bloqueantes de `/deploy` — cookie de refresh `SameSite=Strict` (quebra garantida em produção cross-site) e `COOKIE_SECRET` com default hardcoded — foram **corrigidos diretamente por mim durante a auditoria original** (mudança pequena e direta, conforme autonomia concedida para achados desta natureza). Ver seção 4.

A auditoria original também encontrou **dois achados novos de severidade Alta** (A1 — vazamento de PII via `GET /api/babas/:id/eventos`; A2 — rate limiting ineficaz atrás do proxy do Render por falta de `trust proxy`), reportados ao `dev-senior`. **Ambos foram corrigidos e re-verificados nesta rodada (seção 6) — confirmo que estão de fato resolvidos.** A migração de schema Prisma que acompanhou as correções (cascades em `TeamMember`/`GameEvent`/`Suspension`) também foi re-auditada e não introduz nenhum caminho de deleção em cascata perigoso.

Nenhum achado 🔴 crítico ou 🟠 alto permanece em aberto. **Recomendação: nada impede o `/deploy` do ponto de vista de segurança.** Os itens 🟡/🟢 remanescentes (seção 2) são dívida técnica não-bloqueante, já registrada.

---

## 2. Achados

### 🔴 Crítico

Nenhum achado crítico em aberto. Os dois pontos que se qualificariam (cookie cross-site e segredo com fallback hardcoded) foram corrigidos na auditoria original — ver seção 4.

---

### 🟠 Alto — RESOLVIDOS (ver seção 6 para a re-verificação completa)

#### A1. Vazamento de PII (e-mail/telefone) de sócios e convidados para qualquer sócio autenticado, via lista de gols/cartões de um baba — ✅ CORRIGIDO E RE-VERIFICADO

**Arquivo original do achado:** `backend/src/repositories/gameEvents.repository.ts:8` (`findByBabaId`), consumido por `GET /api/babas/:id/eventos` (rota liberada para **Diretor + Sócio**).

`socio: true`/`convidado: true` era um **include completo** do model (com `email`/`phone`), devolvido ao cliente sem serializer. Qualquer sócio autenticado conseguia ler e-mail/telefone de outros sócios/convidados via essa rota — violação de controle de acesso a nível de propriedade do objeto (OWASP API3:2023).

**Status:** corrigido pelo dev-senior trocando `include` completo por `select` mínimo (`{ id, name }`) em `gameEvents.repository.ts`, `presencas.repository.ts`, `teams.repository.ts` e `babas.repository.ts`, mais um serializer explícito (`sanitizeEventoParaResposta`) no controller como defesa em profundidade. Re-verificação completa na seção 6.1 — confirmado sem vazamento remanescente.

#### A2. Rate limiting por IP ineficaz atrás do proxy reverso (Render) — ausência de `trust proxy` — ✅ CORRIGIDO E RE-VERIFICADO

**Arquivo original do achado:** `backend/src/app.ts` (não chamava `app.set('trust proxy', ...)`).

Sem confiar no proxy, `req.ip` era igual para todas as requisições (o IP do proxy do Render), fazendo o rate limiter (login incluso) virar um balde único compartilhado por todos os usuários — quebra da proteção de força bruta e risco de negação de serviço coletiva.

**Status:** corrigido pelo dev-senior com `app.set('trust proxy', env.TRUST_PROXY_HOPS)`, `TRUST_PROXY_HOPS` configurável via env (default `1`). Re-verificação completa (incluindo avaliação de risco de spoofing de IP com o valor escolhido) na seção 6.2 — confirmado correto.

---

### 🟡 Médio

#### M1. Upload de comprovante confia apenas no `Content-Type` declarado pelo cliente (mimetype spoofing)

**Arquivo:** `backend/src/middlewares/upload.middleware.ts:9-19`.

Confirmado (o code review já havia apontado, aprofundando aqui): `file.mimetype` vem do cabeçalho multipart declarado pelo próprio cliente, tão falsificável quanto a extensão — um atacante pode subir um `.html`/`.svg`/script disfarçado de `image/png`. Isso é agravado por dois pontos adicionais encontrados nesta auditoria:

- **Nome de arquivo não sanitizado:** `backend/src/services/despesas.service.ts:34` monta o path de storage como `` `${crypto.randomUUID()}-${attachment.originalname}` ``, usando `originalname` (controlado pelo cliente) sem sanitização. Caracteres de controle, barras (`/`, cria "subpastas" dentro do bucket) ou nomes longos podem ir parar no path do objeto no Supabase Storage sem validação.
- Como o arquivo é servido sempre via URL assinada de curta duração (nunca estático/público) e o bucket é privado, o risco de execução direta (ex.: XSS via HTML hospedado) é baixo — mas ainda existe risco de um arquivo malicioso ser baixado e aberto por um diretor confiando que é um comprovante legítimo (ex.: PDF/imagem com payload embutido para explorar um leitor vulnerável do lado do diretor).

**Como corrigir:**
1. Após o multer aceitar o arquivo em memória, inspecionar os **magic bytes reais** do buffer (lib `file-type` ou equivalente) e rejeitar se o tipo detectado não estiver na allowlist (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`), mesmo que o `Content-Type` declarado bata.
2. Sanitizar/descartar `originalname`: gerar o nome inteiramente no backend (ex.: só `${crypto.randomUUID()}.${extensãoDerivadaDoMimetypeReal}`), nunca interpolar o nome enviado pelo cliente no path de storage.

Não bloqueante para `/deploy`, mas recomendo priorizar — é barato de corrigir e o vetor (upload de arquivo) é o mais clássico da lista.

#### M2. Refresh token sem mecanismo de revogação — logout e troca de senha não invalidam sessões já emitidas

**Arquivos:** `backend/src/services/auth.service.ts` (`refresh`, `resetPassword`), `backend/src/controllers/auth.controller.ts` (`logout`).

O design é stateless por decisão de arquitetura (ADR-01, sem sessão em banco) — trade-off razoável para o volume do projeto, mas vale documentar o residual: `logout` apenas limpa o cookie no client (`res.clearCookie`); não existe lista de revogação/`tokenVersion` no banco. Se um refresh token vazar (ex.: XSS pontual, dispositivo comprometido), ele continua **válido por até 7 dias** mesmo depois que o usuário faz logout ou troca a senha via `resetPassword` — `resetPassword` atualiza o hash da senha mas não invalida refresh tokens já emitidos para aquele `userId`.

**Como corrigir (não bloqueante, registrar como dívida técnica):** adicionar um campo `tokenVersion` (Int) em `User`, incluí-lo no payload do refresh token, incrementá-lo em `resetPassword` (e opcionalmente em `logout`, se quiser revogação imediata de fato) e validar em `authService.refresh` que o `tokenVersion` do token bate com o valor atual do usuário no banco.

#### M3. `jwt.verify` sem restrição explícita de `algorithms`

**Arquivo:** `backend/src/lib/jwt.ts:28-34`.

`verifyAccessToken`/`verifyRefreshToken` chamam `jwt.verify(token, secret)` sem passar `{ algorithms: ['HS256'] }`. A biblioteca `jsonwebtoken@9` não é vulnerável ao clássico ataque "alg: none" por padrão, mas não restringir explicitamente o(s) algoritmo(s) aceito(s) é uma prática recomendada (OWASP JWT Cheat Sheet) de defesa em profundidade contra confusão de algoritmo, especialmente se o projeto algum dia migrar para segredos assimétricos. Ajuste mecânico e de baixo risco: adicionar `{ algorithms: ['HS256'] }` nas duas funções de verificação.

#### M4. `frontend/middleware.ts` especificado na arquitetura não existe — confirmado que é só UX, não autorização real

**Arquivo esperado:** `frontend/middleware.ts`. Implementado: `frontend/lib/auth/RequireRole.tsx`, usado em `app/(diretor)/layout.tsx` e `app/(socio)/layout.tsx`.

Reauditado do zero (não tomei o code review como verdade): percorri as ~30 rotas do backend (`backend/src/routes/*.ts`) e confirmo que **toda** rota protegida passa por `authMiddleware` (valida JWT) e, quando aplicável, por `requireRole('DIRETOR')` e/ou `requireOwnerOrDirector()` — nenhuma depende do front para autorizar. `RequireRole.tsx` é client-side, só decide o que renderizar/redirecionar (mostra spinner até `useAuth()` resolver via `GET /api/me`); como o componente não renderiza `children` antes de confirmar o papel, as páginas internas não chegam a disparar suas chamadas de dados antes da checagem — ou seja, não há nem sequer uma janela de "flash" de dados de outro papel. **Confirmo o parecer do code review: é uma divergência de arquitetura documentada (custo de latência/UX, RNF3), não uma falha de autorização.**

**Recomendação:** registrar formalmente a decisão como adendo ao ADR-01 (a alternativa de um cookie não sensível só com o `role`, para o middleware do Next decidir o redirect no edge sem tocar no token de acesso, é viável e preserva "token de acesso nunca em storage persistente") — ou implementar o `middleware.ts`. Não bloqueia `/deploy`.

#### M5. Ausência de headers de segurança (CSP) na aplicação Next.js do frontend

**Arquivo:** `frontend/next.config.js` (só `reactStrictMode: true`).

`helmet()` protege as respostas da API (backend), mas o frontend (HTML/JS servido pelo Next no Vercel) não define uma Content-Security-Policy própria. O risco prático é baixo hoje (React escapa por padrão; `grep` não encontrou nenhum uso de `dangerouslySetInnerHTML` em todo o `frontend/`), mas é uma camada de defesa em profundidade recomendada pelo baseline (item 6) que falta especificamente no lado do Next. **Correção sugerida:** adicionar `headers()` em `next.config.js` com CSP/X-Frame-Options/X-Content-Type-Options, ou configurar via `vercel.json`.

---

### 🟢 Baixo

#### B1. `npm audit --audit-level=high` — vulnerabilidades residuais avaliadas

**Backend:** 12 vulnerabilidades reportadas (6 moderate, 5 high, 1 critical), mas **todas** estão em `vitest`/`vite`/`esbuild` (devDependency de teste, não embarcada no build de produção `dist/`) ou em `extract-zip` (dependência transitiva de `puppeteer`, usada apenas para extrair o Chromium baixado durante `npm install`/setup — não é código executado a partir de input de usuário em runtime). Nenhuma vulnerabilidade alta/crítica está em uma dependência de produção exposta a requisições HTTP externas. Ainda assim, recomendo atualizar `puppeteer` para uma versão que não dependa da `extract-zip` vulnerável, quando for conveniente (não bloqueante).

**Frontend:** 2 vulnerabilidades (1 moderate, 1 high) — ambas em `postcss`, dependência transitiva do `next@15.5.25` usada em build-time (processamento de CSS confiável do próprio projeto, não de input de usuário). Decisão já registrada pelo dev/reviewer de não migrar para Next 16 agora é razoável; residual aceito e documentado aqui.

#### B2. `sendPasswordResetEmail` não envia e-mail nenhum em produção

**Arquivo:** `backend/src/lib/email.ts:9-11` — em produção, a função simplesmente retorna sem fazer nada (`// TODO: integrar provedor de e-mail real`). Não é uma falha de segurança (falha "segura": o token não é logado nem vazado em produção, diferente do modo dev que loga no console), mas é uma lacuna funcional que quebra RF2 (recuperação de senha por e-mail) até um provedor real (`EMAIL_PROVIDER_API_KEY`) ser integrado. Sinalizo por completude; não é escopo desta auditoria de segurança resolver.

#### B3. FK sem `onDelete: Cascade` em `TeamMember`/`GameEvent` (achado do code review) — ✅ CORRIGIDO E RE-VERIFICADO

Ver seção 6.3 — o dev-senior corrigiu via cascade explícito no schema (v002) combinado com deleção explícita e auditada na aplicação. Re-verificado sem introdução de cascade perigoso.

---

## 3. Correções aplicadas diretamente por mim na auditoria original

Conforme autonomia concedida para achados que bloqueariam `/deploy` e são pequenos/diretos, apliquei as duas correções abaixo e revalidei (`tsc --noEmit` limpo após as mudanças):

1. **`backend/src/controllers/auth.controller.ts`** — cookie de refresh alterado de `sameSite: 'strict'` (fixo) para `sameSite: isProduction ? 'none' : 'lax'`, mantendo `secure: isProduction`. Justificativa: front (Vercel) e back (Render) são domínios registráveis diferentes; `Strict` bloqueia o cookie em toda chamada `fetch` cross-site, inclusive as da própria aplicação — o refresh nunca chegaria ao backend em produção. `SameSite=None` exige `Secure` (por isso o valor só é aplicado quando `NODE_ENV=production`; em dev `http://localhost` o browser rejeitaria `None` sem HTTPS, por isso uso `Lax` localmente). **Avaliação de CSRF:** não é necessário adicionar um token CSRF explícito porque (a) toda rota de mutação de negócio já usa o access token no header `Authorization`, nunca o cookie, então um `<form>`/`fetch` forjado em outro site não consegue setar esse header; (b) o único endpoint que lê o cookie é `POST /auth/refresh`, que não muda estado de negócio (só emite um novo access token); (c) mesmo que um site atacante consiga disparar esse POST com o cookie (SameSite=None permite), o CORS configurado (`origin` restrito à lista de `CORS_ALLOWED_ORIGINS`, nunca `*`, com `credentials: true`) impede que o JavaScript do atacante **leia** a resposta — a política de mesma origem bloqueia isso independentemente do SameSite do cookie. Superfície de CSRF permanece, na prática, a mesma descrita no modelo de ameaças original da arquitetura (seção 7).

2. **`backend/src/lib/env.ts`** — removido o `.default('dev-cookie-secret-change-me')` de `COOKIE_SECRET`; agora é obrigatório (`z.string().min(16)`), no mesmo padrão fail-fast de `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`. Justificativa: um fallback hardcoded e versionado no código-fonte, mesmo rotulado "dev", quebra o padrão de fail-fast dos outros segredos — se `COOKIE_SECRET` não fosse configurado no Render por engano, o processo subiria "normalmente" com um valor público e previsível. **Nota de contexto:** verifiquei que hoje `COOKIE_SECRET`/`cookie-parser(secret)` não está de fato sendo usado para assinar cookies (o refresh é lido via `req.cookies`, não `req.signedCookies`, e a integridade do refresh token já vem da assinatura do próprio JWT) — ou seja, o valor não tinha impacto de segurança explorável *hoje*, mas a correção evita que o hábito de "default hardcoded" se torne um problema real se o código passar a depender dele no futuro, e alinha com o baseline (item 1: nenhum segredo, nem que seja um placeholder, deve viver versionado com valor real de fallback).

Nenhuma outra alteração de código de produção foi feita nesta fase — os achados 🟡/🟢 remanescentes são reportados com a correção precisa para o `dev-senior` aplicar, quando priorizado.

---

## 4. Checklist do baseline (`docs/seguranca.md`)

| # | Item | Status |
|---|---|---|
| 1 | Nenhum segredo em código/versionado | ✅ Confirmado (varredura por `Bearer `, `sk_`, connection strings, `password=`, JWT — nada encontrado); `.env` no `.gitignore`, só `.env.example` versionado |
| 1 | Segredo com fallback hardcoded | ✅ Corrigido nesta fase (`COOKIE_SECRET`) |
| 2 | Hash forte de senha (bcrypt/argon2) | ✅ `bcryptjs`, 12 salt rounds (`backend/src/lib/password.ts`) |
| 2 | JWT com segredo forte/env, expiração curta, assinatura verificada | ✅ `JWT_ACCESS_EXPIRES_IN=15m`, secrets via env obrigatórios (min 16 chars); ⚠️ `algorithms` não restringido explicitamente no `verify` (M3, baixo risco) |
| 2 | Rate limiting e proteção contra brute force no login | ✅ Corrigido e re-verificado (A2 — `trust proxy`, seção 6.2) |
| 2 | Sem enumeração de usuário nas mensagens de erro | ✅ `login`/`forgotPassword` sempre retornam mensagem genérica/202 |
| 3 | Toda rota protegida checa permissão no backend | ✅ Reauditado rota a rota (~30 arquivos de rotas); todas passam por `authMiddleware` + `requireRole`/`requireOwnerOrDirector` quando aplicável |
| 3 | Sem IDOR | ✅ Padrão `/me/*` resolve `socioId` do JWT; rotas com `:id` usam `requireOwnerOrDirector` |
| 3 | Menor privilégio | ✅ Corrigido e re-verificado (A1 — over-fetch de PII, seção 6.1) |
| 4 | Zod em toda fronteira | ✅ Body/params/query cobertos em todos os módulos revisados |
| 4 | Limites de tamanho de payload/upload | ✅ `express.json({ limit: '1mb' })`; multer `fileSize: 5MB` |
| 4 | Nunca SQL por concatenação | ✅ 100% Prisma; nenhum `$queryRawUnsafe`/concatenação encontrada |
| 5 | Erros sem stack trace/detalhes internos | ✅ `errorHandlerMiddleware` central, resposta genérica para erros não mapeados |
| 5 | Logs sem senha/token/PII | ✅ `AuditLog` guarda dado mínimo (RSP9); e-mail de reset não é logado em produção |
| 5 | HTTPS em produção | ✅ Depende do Render/Vercel (padrão da plataforma); `secure: true` no cookie em produção |
| 6 | Headers via helmet | ✅ Aplicado globalmente no backend; ⚠️ frontend sem CSP própria (M5, baixo) |
| 6 | CORS restritivo | ✅ Origem explícita via `CORS_ALLOWED_ORIGINS`, nunca `*`, `credentials: true` só com origem conhecida |
| 6 | Cookies HttpOnly/Secure/SameSite | ✅ Corrigido nesta fase (`SameSite=None; Secure` em produção, `HttpOnly` sempre) |
| 6 | Rate limiting global e reforçado em rotas sensíveis | ✅ Corrigido e re-verificado (A2, seção 6.2) |
| 7 | `npm audit --audit-level=high` limpo | ⚠️ Não "limpo" literalmente, mas 100% das vulnerabilidades altas/críticas residuais estão em devDependencies de teste ou em ferramentas de build-time (B1), avaliadas e aceitas como risco residual documentado |
| 8 | RLS ativo / chave de serviço nunca no frontend | ✅ N/A estrito (arquitetura não expõe Postgres/Supabase client-side; único acesso ao banco é via Prisma no backend com `DATABASE_URL`); `SUPABASE_SERVICE_ROLE_KEY` só existe em `backend/src/lib/supabaseStorage.ts`, nunca no `frontend/` |
| 8 | Backups e migrations versionadas | ✅ Migrations em `backend/prisma/migrations`; backup é responsabilidade operacional do Supabase (RNF6, fora do escopo de código) |
| 9 | Regra de ouro: na dúvida, sinalize | Aplicada — A1/A2 eram achados novos, não estavam no `code-review.md`; ambos corrigidos e re-verificados |

---

## 5. Próximos passos (histórico da auditoria original — ver seção 6 para o estado atual)

1. ~~Antes do `/deploy`: `dev-senior` deve corrigir A1 e A2~~ — **feito, ver seção 6.**
2. Itens 🟡/🟢 desta lista (M1–M5, B1–B3) podem entrar como backlog priorizado; M1 (magic bytes + sanitização de nome de arquivo) e M2 (revogação de refresh token) valem a pena resolver antes do `/deploy` por serem baratos e de impacto real, mas **não bloqueiam**.
3. ~~Após as correções de A1/A2, re-auditar especificamente esses pontos antes do `/deploy`~~ — **feito, ver seção 6.**

---

## 6. Re-verificação pós-correção (rodada 2)

O `dev-senior` reportou a correção dos dois achados 🟠 Alto (A1, A2), do bug 🔴 #1 de FK/cascade herdado do `code-review.md`, e de outros itens do QA. Esta seção documenta a re-auditoria feita **lendo o código atual diretamente** (não a partir da descrição do dev), conforme solicitado.

### 6.1 A1 — Vazamento de PII via `GET /api/babas/:id/eventos`: ✅ RESOLVIDO

**Verificação em `backend/src/repositories/gameEvents.repository.ts`:** `findByBabaId` agora usa `select: EVENT_SELECT`, com `SAFE_PARTICIPANT_SELECT = { select: { id: true, name: true } }` aplicado a `presenca.socio` e `presenca.convidado`. Nenhum campo `email`/`phone` é buscado no banco para essa query — não é apenas "filtrado depois", é **selecionado com escopo mínimo na própria query Prisma**, o que é a correção correta (elimina o over-fetch na fonte, não só no output).

**Verificação em `backend/src/controllers/babas.controller.ts`:** além do `select` no repository, o controller aplica `sanitizeEventoParaResposta` em cada evento antes de responder — um serializer explícito que reconstrói `presenca.socio`/`presenca.convidado` chamando `toSafeParticipant`, que só copia `id` e `name` (via `String(raw.id ?? '')`/`String(raw.name ?? '')`, descartando qualquer outro campo do objeto de entrada). Testei mentalmente o pior cenário (alguém reintroduzir um `include` completo no repository por engano no futuro): mesmo assim, o serializer do controller barra o vazamento antes da resposta HTTP — **defesa em profundidade real, não decorativa**.

**Verificação dos repositórios "irmãos" citados no achado original:**
- `backend/src/repositories/babas.repository.ts` (`findById`, usado por `GET /babas/:id`, também acessível a Diretor+Sócio): agora usa `select` com `PRESENCA_SELECT` (`{ id, participantType, socioId, convidadoId, position, socio: {id,name}, convidado: {id,name} }`) em `presencas`, `teams.members.presenca` e `events.presenca`. Confirmado: **nenhum campo de contato trafega neste endpoint**, que era o outro caminho de leitura acessível a sócios além de `/eventos` e não havia sido mencionado explicitamente no relatório original — o dev corrigiu por iniciativa própria e eu confirmo que era necessário (o `include` completo antigo já não estava mais lá).
- `backend/src/repositories/presencas.repository.ts` e `backend/src/repositories/teams.repository.ts`: também migrados para `select` mínimo. Como já registrado no achado original, essas rotas (`PUT /babas/:id/presenca`, `POST /babas/:id/sorteio`, `PUT /babas/:id/times`) são exclusivas de `DIRETOR`, então a correção aqui é reforço de menor privilégio, não fechamento de uma brecha cross-role — mas confirmo que foi aplicada de forma consistente.

**Verificação de que não sobrou nenhum `include: { socio: true }`/`{ convidado: true }` órfão:** rodei `grep` em todo `backend/src` novamente. Único resultado restante: `backend/src/repositories/users.repository.ts:7,11` (`findByEmail`/`findById` do model `User`, com `include: { socio: true }`). Confirmei que esses dois métodos só são usados por `authService` (login/refresh, nunca devolvido cru ao cliente — só campos específicos são extraídos) e por `meService.getMe` (que monta a resposta de `GET /api/me` extraindo `{ id, name, email, phone }` do **próprio** `req.user.sub`, ou seja, o usuário lendo seus próprios dados, não os de outro sócio). **Não há vazamento cross-usuário aqui.**

**Conclusão A1: corrigido corretamente, na fonte (select) e com defesa em profundidade (serializer). Re-testei o raciocínio de "sócio A vê dado de sócio B" para os três endpoints acessíveis a sócios que tocam presença/eventos (`GET /babas/:id`, `GET /babas/:id/eventos`, `GET /rankings`) e nenhum deles expõe e-mail/telefone.**

### 6.2 A2 — Rate limiting atrás do proxy do Render: ✅ RESOLVIDO, valor de `TRUST_PROXY_HOPS=1` está correto

**Verificação em `backend/src/app.ts`:** `app.set('trust proxy', env.TRUST_PROXY_HOPS)` é chamado na criação do app, antes do registro de qualquer middleware — ordem correta (é uma configuração do `app`, não um middleware, mas ainda assim precisa estar setada antes de qualquer requisição ser processada, o que está garantido aqui).

**Verificação em `backend/src/lib/env.ts`:** `TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1)` — configurável por ambiente, com default `1`.

**O valor `1` é o correto para a topologia do Render, e evita tanto o problema original quanto um novo problema de spoofing:**
- Render (como Heroku) expõe a aplicação atrás de **um único hop de proxy/load balancer** que termina TLS e repassa a requisição com `X-Forwarded-For` contendo o IP real do cliente. Isso é exatamente o cenário para o qual a documentação do Express e do `express-rate-limit` recomendam `trust proxy = 1` — não `true`.
- **Por que não `true` (ou um número maior que o real)?** Quando `trust proxy` está configurado como `true` (ou um número de hops maior que o real), o Express passa a confiar em **todos** os IPs listados em `X-Forwarded-For`, inclusive os que um cliente externo pode forjar livremente antepondo valores falsos ao cabeçalho antes que ele chegue ao proxy (`X-Forwarded-For: 1.2.3.4, <ip real do atacante>`) — um atacante conseguiria fazer o `req.ip` "virar" qualquer IP que quisesse, esvaziando o rate limit por IP (exatamente o oposto do que se quer corrigir). Com `trust proxy = 1`, o Express usa apenas o hop mais à direita da lista (o que o proxy confiável — o Render — de fato anexou), ignorando qualquer prefixo forjado pelo cliente. Essa é a mitigação correta para o cenário descrito pelo `express-rate-limit` no seu próprio guia de troubleshooting (que usa exatamente o exemplo de "1 proxy reverso confiável" como o Render/Heroku).
- Resultado: com `TRUST_PROXY_HOPS=1`, `req.ip` volta a refletir o IP real de cada cliente, então `authRateLimiter` (10/15min) e `globalRateLimiter` voltam a isolar corretamente por usuário/atacante, sem abrir uma brecha de spoofing via cabeçalho forjado.

**Ressalva não-bloqueante:** este valor pressupõe que a topologia de deploy real no Render seja de fato um único hop de proxy na frente do processo Node (é o padrão documentado do Render para serviços web, e a variável já é configurável via env caso a infraestrutura real tenha mais hops — ex.: um CDN/WAF adicional na frente). Recomendo ao time de deploy confirmar isso na primeira suspeita de rate limit anômalo em produção, com um log pontual de `req.ips`/`req.headers['x-forwarded-for']` — mas isso é validação operacional de infraestrutura, não um problema de código, e não bloqueia o `/deploy`.

**Conclusão A2: corrigido corretamente. `TRUST_PROXY_HOPS=1` (default) é o valor apropriado para a topologia declarada (Render, 1 hop) e não introduz risco de spoofing de IP.**

### 6.3 Migração de schema Prisma (v002 — cascade em `TeamMember`/`GameEvent`/`Suspension`): sem implicação de segurança perigosa

Li o `schema.prisma` atual por completo e listei **todas** as relações com `onDelete: Cascade` no projeto — são exatamente três, todas novas nesta migração:

1. `TeamMember.presenca → Presenca` (`onDelete: Cascade`)
2. `GameEvent.presenca → Presenca` (`onDelete: Cascade`)
3. `Suspension.originEvent → GameEvent` (`onDelete: Cascade`)

**Análise de risco:**
- As três cascades ficam **inteiramente contidas no módulo de futebol** (times/eventos/suspensões) e formam uma cadeia única: apagar uma `Presenca` cascade-apaga `TeamMember`/`GameEvent` ligados a ela, o que por sua vez cascade-apaga `Suspension` originada de um `GameEvent` apagado. Nenhuma delas toca modelos financeiros (`SocioPayment`, `GuestPayment`, `Expense`, `OtherRevenue`, `MonthlyClosingBalance`, `AccountabilityReport`) nem o histórico de status sensível (`SocioStatusMensal`, dado DM/RSP2) — ou seja, não existe caminho, direto ou indireto, para uma deleção em cascata apagar dado financeiro ou de saúde.
- **Único caminho de código que deleta `Presenca` hoje:** `presencasRepository.replaceAll` (`backend/src/repositories/presencas.repository.ts`), usado por `PUT /api/babas/:id/presenca` (exclusivo de `DIRETOR`). Confirmei via `grep` em `backend/src` que não existe nenhum outro `prisma.presenca.delete`/`deleteMany` no código — logo, o cascade do banco não é hoje acionado por uma rota diferente da que o dev já tratava explicitamente. Aliás, o método `replaceAll` **já apaga manualmente** (`Suspension` → `GameEvent`/`TeamMember` → `Presenca`, nessa ordem, na mesma transação) antes de recriar a lista, e registra em `AuditLog` (`presenca.replace_com_perda_de_dados`) sempre que essa substituição de fato remove times/eventos já lançados. O `onDelete: Cascade` no schema é redundante com esse código hoje — é, como o próprio comentário no schema explica, defesa em profundidade para caminhos de deleção que venham a existir no futuro (ex.: se alguém um dia adicionar um endpoint de deleção direta de presença sem passar por `replaceAll`), não uma nova superfície de perda de dado silenciosa introduzida agora.
- `DELETE /api/eventos/:id` (`eventosController.delete`, exclusivo de `DIRETOR`) continua chamando explicitamente `suspensionsRepository.deleteByOriginEventId(id)` antes de `gameEventsRepository.delete(id)` — com o cascade novo em `Suspension.originEvent`, essa chamada manual ficou redundante (o banco já apagaria a suspensão sozinho), mas não é incorreta nem perigosa, só uma query a mais. Sem impacto de segurança.
- Nenhuma relação de `Socio`/`Convidado`/`BabaDoDia` para os modelos financeiros ou de futebol ganhou cascade — continuam `RESTRICT` (padrão), o que é o comportamento correto: por exemplo, não existe (e não deveria existir) um caminho que apague um `Socio` e arraste consigo `SocioPayment`/`SocioStatusMensal`/`Suspension` em cascata.

**Conclusão: a migração v002 não abre nenhum caminho de deleção em cascata perigoso ou não intencional.** É uma correção de integridade de dados bem escopada, com o comportamento de auditoria (RNF5/RNF8) preservado no único caminho de aplicação que hoje aciona essas cascades.

### 6.4 Veredito final desta rodada

- **A1: RESOLVIDO.** Confirmado por leitura direta do código (repositórios + controller), não apenas pela descrição do dev.
- **A2: RESOLVIDO.** Confirmado que `TRUST_PROXY_HOPS=1` é o valor correto para a topologia do Render, sem reintroduzir risco de IP spoofing.
- **Migração de schema (cascades v002): sem implicação de segurança.** Escopo contido ao módulo de futebol, sem alcançar dado financeiro/de saúde, e consistente com o comportamento de auditoria já existente.
- **Nenhum achado 🔴 crítico ou 🟠 alto permanece em aberto.** Os itens 🟡/🟢 remanescentes (M1–M5, B1–B2) são dívida técnica não-bloqueante — recomendo priorizar M1 (upload) e M2 (revogação de refresh token) logo após o `/deploy`, mas nenhum deles impede o go-live.

**Do ponto de vista desta auditoria de segurança, não há nada que impeça o `/deploy`.**
