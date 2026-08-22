# Como Usar — Passo a Passo

Guia prático para criar um projeto do zero com esta estrutura. Do clone ao deploy.

---

## Pré-requisitos (uma vez na máquina)

- **Claude Code** instalado.
- **Git** instalado (no Windows, o Git Bash vem junto — é ele que roda o hook).
- **Node.js 20+**.
- **GitHub CLI (`gh`)** — opcional, mas facilita criar repo e abrir PR.

---

## Passo 0 — Clonar o template

1. **Copie** a pasta `estrutura-base` inteira e dê o nome do projeto novo (ex.: `agenda-clinica`). Nunca trabalhe no template original.
2. Dentro da cópia, **apague qualquer pasta `.claude/` antiga** que exista.
3. **Renomeie `claude-config/` → `.claude/`**. É o rename que faz o Claude Code enxergar os agentes e comandos.
4. Abra a pasta no Claude Code.

> A partir daqui, tudo é conversa no Claude Code. Você pode digitar os comandos `/...` ou simplesmente falar o que quer — veja "As duas formas de conduzir" no fim.

---

## Passo 1 — `/iniciar-projeto` (setup)

Rode `/iniciar-projeto`. Ele pergunta, uma coisa de cada vez:
- nome e descrição do projeto;
- tipo (app web, API, sistema interno...);
- **qual banco** (SQL Server, MySQL, PostgreSQL, Supabase ou MongoDB);
- repositório GitHub;
- destinos de deploy.

Ao final ele preenche a configuração, inicializa o git e **ativa o hook** de documentação do banco. Você só faz isso **uma vez** por projeto.

---

## Passo 2 — `/planejar` (o que o sistema vai ser)

Aqui você **conversa**. Fale sua ideia e o porquê dela — sem se preocupar em ser perfeito no primeiro texto. O Analista pergunta, provoca e lembra do que faltou. No fim, ele grava o PRD com o **mapa funcional** e o **inventário de telas** (a lista de todas as telas — base do protótipo).

Só siga em frente quando o inventário de telas estiver do jeito que você quer.

---

## Passo 3 — `/prototipar` (desenhar todas as telas antes de codar)

O agente de UX/Design:
1. **Pergunta se você tem referência** (texto, imagem, link ou design system). Se não tiver, te **entrevista** (cores, formato de botão, tipografia, tom) e propõe um estilo.
2. Cria **tela por tela** em HTML, salvando cada uma em `prototipo/`. Você aprova cada tela antes da próxima.
3. Quando todas estão prontas, gera o `docs/design-system.md` com os padrões.

Abra os arquivos de `prototipo/` no navegador para revisar. **Este é o passo que evita retrabalho:** o visual fica 100% decidido antes de qualquer código.

---

## Passo 4 — `/arquitetar` (o plano técnico)

O Arquiteto lê o PRD e os protótipos e define modelo de dados (schema Prisma), contratos de API, autorização por endpoint e a estrutura de pastas. Sai o `docs/planning/architecture.md`.

---

## Passo 5 — `/desenvolver` (construir)

O Dev implementa **uma história por vez**, fiel ao protótipo e ao design system, com o backend em camadas (controller → service → repository) e validação Zod. Se mexer no banco, ele documenta o schema antes de encerrar.

Dica: você pode dizer o que quer implementar primeiro, ex.: *"começa pelo cadastro de pacientes"*.

---

## Passo 6 — `/revisar` (qualidade)

O Code Reviewer confere arquitetura, qualidade e **fidelidade ao protótipo**. Gera `code-review.md`. Se achar algo bloqueante (🔴), volta pro Dev automaticamente.

---

## Passo 7 — `/seguranca` (blindagem)

O Engenheiro de Segurança audita OWASP, segredos, autorização, dependências. Gera `security-report.md`. **Achado crítico bloqueia o deploy** e volta pro Dev.

---

## Passo 8 — `/testar` (validação)

O QA escreve e roda testes (unit, integração, e2e), valida cada critério de aceite e a fidelidade visual. Gera `qa-report.md`. Reprovou? Volta pro Dev.

---

## Passo 9 — `/deploy` (publicar)

O DevOps só age se segurança e QA aprovaram. Roda o checklist (sem segredos, CI verde, build ok, migrations) e publica banco, backend e frontend. **Ele confirma com você antes do deploy final.**

---

## Comandos de apoio (use quando precisar)

- **`/git`** — commit e push seguros (Conventional Commits, sem versionar segredo).
- **`/documentar-banco`** — atualiza a doc do banco quando o schema muda (o Dev já faz isso, mas você pode chamar direto).
- **`/retomar`** — início do dia: lê a memória de forma econômica e resume onde paramos.
- **`/encerrar-dia`** — fim do dia: registra tudo que foi feito e as próximas demandas.

---

## O ciclo de vários dias

Projetos não terminam num dia. O ritmo é:

```
Manhã:  /retomar   → ele te diz onde paramos e o que falta
Dia:    trabalha o fluxo (conversando ou por comando)
Noite:  /encerrar-dia → ele documenta o dia e prepara o amanhã
```

Assim você nunca perde o fio, e a leitura da memória é barata (só o essencial).

---

## As duas formas de conduzir

Você **não precisa** digitar um comando a cada etapa. Há dois modos, e dá pra misturar:

1. **Conversando (recomendado no dia a dia):** fale o que quer e diga *"pode seguir"*. Os agentes avançam sozinhos de fase em fase, se autocorrigem em caso de erro (até 3 tentativas) e só param para decisões suas ou ações destrutivas.
2. **Por comando (quando quer controle):** digite `/planejar`, revise, depois `/prototipar`, e assim por diante — pausando entre cada fase.

Os comandos que valem digitar sempre são os "marcos": `/iniciar-projeto` (uma vez), `/retomar` (início do dia) e `/encerrar-dia` (fim do dia).

---

## Regras que o sistema nunca quebra

- Nenhum segredo em arquivo versionado (o `.gitignore` e o QA cuidam disso).
- O sistema real fica **idêntico** ao protótipo aprovado.
- Deploy só depois de segurança **e** QA aprovarem.
- Mudou o banco → a doc é atualizada (o hook trava o commit se esquecer).
- Nunca `git add -A`; sempre arquivos específicos.
