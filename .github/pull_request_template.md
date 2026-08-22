# Pull Request

## O que muda
<!-- Descreva a mudança e o porquê. Referencie a história/RF do PRD. -->

## Tipo
- [ ] feat (nova funcionalidade)
- [ ] fix (correção)
- [ ] refactor
- [ ] test
- [ ] chore/docs

## Checklist
- [ ] Segue a arquitetura em camadas (controller → service → repository)
- [ ] Toda entrada validada com Zod
- [ ] Checagem de tipos passa (`npx tsc --noEmit`)
- [ ] Lint passa
- [ ] Testes cobrem o novo comportamento e passam
- [ ] Critérios de aceite da história atendidos

## Segurança
- [ ] Nenhum segredo commitado (token, senha, chave, connection string)
- [ ] Autorização checada no backend (não só no front)
- [ ] Sem dado sensível em logs ou mensagens de erro
- [ ] Dependências novas auditadas (`npm audit`)
- [ ] Revisão do agente de segurança sem achado crítico em aberto
