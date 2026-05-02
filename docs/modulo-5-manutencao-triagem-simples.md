# Módulo 5 - Manutenção com Triagem Simples

## Objetivo

Evoluir o módulo de chamados de manutenção para uma operação mais simples, com triagem objetiva, poucos cliques e alertas acionáveis para a rotina da imobiliária.

## Implementado

- Campo persistente de decisão de triagem no chamado.
- Categoria `Condomínio` adicionada ao catálogo de manutenção.
- Chamados novos passam a nascer em análise, com triagem inicial sugerida por regra.
- Endpoint dedicado para registrar triagem rápida.
- Opções de triagem:
  - Emergencial.
  - Precisa orçamento.
  - Resolver internamente.
- Dashboard passa a destacar chamados em triagem, sem responsável e emergenciais.
- Lista e Kanban receberam filtro por triagem.
- Cards de manutenção exibem badge visual da triagem.
- Detalhe do chamado recebeu painel de triagem rápida e histórico formal da decisão.

## Regras de Negócio

- Chamado emergencial eleva a prioridade para nível 5 quando necessário.
- Chamado que precisa de orçamento mantém prioridade mínima alta.
- Chamado sem responsável passa a ser tratado como crítico para leitura operacional.
- Chamado emergencial gera alerta imediato na área de notificações.
- Chamado finalizado ou cancelado não pode ser triado novamente sem permissão superior.
- Toda decisão de triagem gera histórico.
- Alterações relevantes continuam auditadas no backend.

## Permissões

- `maintenance.read`: permite visualizar dashboard, lista, detalhe e Kanban.
- `maintenance.write`: permite abrir chamado, movimentar status e registrar triagem.
- `maintenance.override`: mantém acesso superior para ações sensíveis, como reabrir chamado terminal e override manual de urgência.
- `tenantPortal.access` e `maintenance.portal.open`: preservam o fluxo de abertura pelo locatário.

## Banco de Dados

Foi criada a migration `20260502170000_add_maintenance_simple_triage` com:

- Novo enum `MaintenanceTriageDecision`.
- Novo valor `CONDOMINIUM` em `MaintenanceTicketType`.
- Novo valor `TRIAGED` em `MaintenanceTicketHistoryActionType`.
- Novos campos em `MaintenanceTicket`:
  - `triageDecision`.
  - `triageNotes`.
  - `triagedAt`.
  - `triagedByUserId`.

## Validação

Validação executada no fechamento do módulo:

- `npm run db:generate`: executado com sucesso.
- `npx prisma validate --config prisma.config.ts`: executado com sucesso.
- `npm run lint`: executado com sucesso.
- `npm run build`: executado com sucesso.
- `npm run db:migrate`: falhou no ambiente local com erro genérico do Prisma schema engine.
- `npm run db:push`: falhou no ambiente local com erro genérico do Prisma schema engine.

Observação: a migration foi criada e versionada. O erro local ocorreu no schema engine ao conectar/aplicar alterações no PostgreSQL local, não na validação do schema nem no build do projeto.
