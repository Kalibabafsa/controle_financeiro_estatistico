# Autonomia e Auto-correção

Como o sistema conduz o trabalho **por conta própria** e se recupera de erros sozinho. Todos os agentes seguem estas regras.

## Execução autônoma do fluxo

- Após o usuário aprovar uma demanda, siga o fluxo (`/planejar → /arquitetar → /desenvolver → /revisar → /seguranca → /testar → /deploy`) **sem pedir confirmação a cada micro-passo**. Avance de fase automaticamente quando a fase atual concluir com sucesso.
- **Pare e pergunte** apenas quando: (a) faltar uma decisão de produto/negócio que só o usuário pode tomar; (b) uma ação for destrutiva ou irreversível (deploy em produção, apagar dados, push forçado); (c) a auto-correção esgotar as tentativas (ver abaixo).
- Ao terminar cada fase, registre o avanço no estado do fluxo (`project.config.md`) e o essencial na memória.

## Protocolo de auto-correção (self-healing)

Quando um passo falhar (erro de compilação, teste vermelho, lint, build, migration, etc.):

1. **Capture o erro** completo (mensagem, arquivo, linha, stack).
2. **Diagnostique a causa raiz** — não trate só o sintoma. Leia o código/contexto envolvido.
3. **Corrija** com a menor mudança que resolve, respeitando arquitetura e convenções.
4. **Reexecute** o mesmo passo que falhou para confirmar.
5. **Repita** até passar, no limite de **3 tentativas** por erro.
6. Se após 3 tentativas não resolver, **pare e reporte**: o que tentou, por que não funcionou, e 1-2 hipóteses/opções para o usuário decidir. Não fique em loop nem invente gambiarra.

## Ciclos entre agentes

- Reviewer, Segurança e QA podem devolver trabalho ao Dev. Isso é automático: se o `code-review.md` tem 🔴, ou o `security-report.md` tem 🔴 crítico, ou o `qa-report.md` reprova, volte ao `dev-senior`, corrija e reexecute a fase que devolveu. Só então siga adiante.

## Limites de segurança (nunca automatizar sem confirmação)

- Deploy/push para produção.
- Apagar ou sobrescrever dados, tabelas ou branches.
- Instalar dependências novas de fonte duvidosa.
- Qualquer coisa que exponha ou rotacione segredos.

## Registro

Toda correção relevante e toda decisão automática entram no log do dia (`/encerrar-dia`) e, se estruturantes, no `MEMORY.md`. O objetivo é que amanhã se saiba não só o que foi feito, mas por quê.
