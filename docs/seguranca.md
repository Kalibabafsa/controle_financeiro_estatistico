# Baseline de Segurança (obrigatório)

Todo sistema construído por esta base **deve** cumprir este baseline. O agente `seguranca` audita item a item na fase `/seguranca`, e um achado crítico bloqueia o deploy. Referência: OWASP Top 10.

## 1. Segredos e credenciais

- Nenhum segredo em código ou arquivo versionado — token, senha, chave de API, connection string. Só `process.env.*`.
- `.env` sempre no `.gitignore`. Só o `.env.example` (sem valores) é versionado.
- Segredos diferentes por ambiente; nunca reutilize entre projetos.
- Se um segredo vazar: **rotacione** (troque) a credencial; apagar do arquivo não basta.
- CI roda varredura de segredos (Gitleaks) a cada push.

## 2. Autenticação

- Senhas com hash forte: **bcrypt** ou **argon2**. Nunca texto puro, MD5 ou SHA1.
- JWT com segredo forte (env), expiração curta e assinatura verificada no backend.
- Login com rate limiting e proteção contra brute force. Sem enumeração de usuários nas mensagens de erro.

## 3. Autorização

- Toda rota protegida checa permissão **no backend**, via middleware. O front nunca é a única barreira.
- Sem IDOR: valide que o usuário logado tem direito ao recurso pedido (não confie no ID vindo do client).
- Princípio do menor privilégio em tokens, papéis e chaves.

## 4. Validação e entrada

- **Zod em toda fronteira**: body, params, query, headers relevantes, formulários.
- Limites de tamanho de payload e de upload; valide tipo/tamanho de arquivos.
- Nunca monte SQL/NoSQL por concatenação — use Prisma/parametrização. Sem `eval`/shell com input do usuário.

## 5. Proteção de dados

- Erros ao cliente sem stack trace nem detalhes internos (handler central).
- Logs sem senha, token ou PII.
- HTTPS em produção. Dados sensíveis criptografados em repouso quando exigido.
- Minimize PII coletada; defina retenção conforme o PRD.

## 6. Configuração de plataforma

- Headers de segurança via **helmet** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- **CORS** restritivo: origens explícitas; nunca `*` junto com credenciais.
- Cookies `HttpOnly`, `Secure`, `SameSite`.
- Rate limiting global e reforçado em rotas sensíveis (login, reset de senha, escrita).

## 7. Dependências

- `npm audit --audit-level=high` limpo em `frontend/` e `backend/` antes do deploy.
- Evite libs abandonadas para funções críticas (auth, cripto). Não escreva cripto própria.

## 8. Banco de dados

- Se usar Postgres/Supabase com RLS: políticas ativas em todas as tabelas; a chave de serviço/admin **nunca** vai ao frontend.
- Backups e migrations versionadas.
- Usuário do banco com privilégios mínimos necessários.

## 9. Regra de ouro

Na dúvida, o agente de segurança **sinaliza**. É melhor uma ressalva a mais do que um vazamento. Segurança não é etapa opcional — é critério de aceite de todo deploy.
