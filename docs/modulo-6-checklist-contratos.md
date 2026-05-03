# Módulo 6 - Checklist antes do Gerador de Contratos

## Objetivo

Adicionar uma etapa obrigatória de checklist antes da geração ou versionamento de minutas de contrato de locação, reduzindo risco operacional e evitando que contratos avancem sem documentação, vencimento, garantia, vistoria e aprovação.

## Implementado

- Checklist obrigatório dentro do gerador de contratos.
- Itens mínimos:
  - Documentos.
  - Dados bancários.
  - Garantia.
  - Vencimento.
  - Vistoria.
  - Aprovação.
- Status por item:
  - Pendente.
  - Em análise.
  - Aprovado.
  - Reprovado.
  - Não se aplica.
- Responsável, observação e anexo opcional por item.
- Bloqueio frontend para usuários sem permissão superior quando houver pendências.
- Bloqueio backend antes de `POST /contracts` e `POST /contracts/:id/versions`.
- Exceção autorizada apenas para MASTER ou usuário com `contracts.review`.
- Persistência do checklist vinculado ao contrato gerado.
- Exibição do checklist no detalhe do contrato.
- Auditoria via logs já existentes de contrato, incluindo indicação de exceção.

## Regras de Negócio

- Contrato sem documentos aprovados não pode ser gerado sem exceção autorizada.
- Contrato sem vencimento aprovado não pode ser gerado sem exceção autorizada.
- Contrato sem aprovação final não pode ser gerado sem exceção autorizada.
- Itens obrigatórios devem estar `APPROVED`.
- Itens obrigatórios não críticos aceitam `APPROVED` ou `NOT_APPLICABLE`.
- Exceção exige justificativa administrativa clara.
- Exceção é gravada no contrato com responsável e data/hora.
- Contratos antigos continuam abrindo mesmo sem checklist.

## Banco de Dados

Foi criada a migration `20260502183000_add_contract_checklist` com:

- Enum `ContractChecklistItemType`.
- Enum `ContractChecklistItemStatus`.
- Model `ContractChecklistItem`.
- Campos de exceção em `Contract`.

## Permissões

- `contracts.generate`: permite acessar o gerador e enviar checklist completo.
- `contracts.review`: permite autorizar exceção de checklist com justificativa.
- `MASTER_ADMIN`: acesso total e autorização de exceção.
- Backend continua bloqueando geração para usuários sem permissão de geração.

## Validação

Validação executada no fechamento do módulo:

- `npm run db:generate`: executado com sucesso.
- `npx prisma validate --config prisma.config.ts`: executado com sucesso.
- `npm run lint`: executado com sucesso.
- `npm run build`: executado com sucesso.
- `git diff --check`: executado com sucesso.
- `npm run db:migrate`: falhou no ambiente local com erro genérico do Prisma schema engine.

Observação: a migration foi criada e versionada. O erro local ocorreu no schema engine ao conectar/aplicar alterações no PostgreSQL local, não na validação do schema nem no build do projeto.
