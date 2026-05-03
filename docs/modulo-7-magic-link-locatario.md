# Módulo 7 - Link Seguro / Magic Link para Locatário

## Objetivo

Criar um acesso simples e seguro para que o locatário consulte informações básicas do contrato vinculado e abra chamados de manutenção sem exigir um portal completo neste primeiro momento.

## Implementado

- Geração de link único por contrato ativo ou renovado.
- Revogação do link atual e geração de novo link pelo usuário interno autorizado.
- Página pública do locatário acessada por token seguro.
- Consulta pública limitada a:
  - Dados básicos do contrato.
  - Dados do imóvel.
  - Histórico de chamados abertos pelo próprio link.
  - Área preparada para documentos liberados futuramente.
- Abertura de chamado de manutenção pelo link.
- Upload de fotos no chamado aberto pelo locatário.
- Exigência de evidência visual para tipos de chamado que precisam de foto.
- Registro de último acesso, IP e navegador.
- Auditoria para geração, revogação e abertura de chamado pelo link.
- Redação de cabeçalhos sensíveis no logger para reduzir risco de exposição do token.

## Regras de Segurança

- O token público não é armazenado em texto puro no banco.
- O banco armazena hash SHA-256 para validação do token.
- O token exibível é criptografado para permitir cópia interna do link enquanto estiver válido.
- O link é sempre vinculado a um contrato e a um locatário específicos.
- O acesso público não expõe dados de outros contratos.
- Links revogados, expirados ou vinculados a contratos inativos são bloqueados.
- Ao gerar um novo link, links ativos anteriores do mesmo contrato são revogados.
- O backend valida o token em todas as rotas públicas.

## Banco de Dados

Foi criada a migration `20260503103000_add_tenant_magic_links` com:

- Enum `TenantMagicLinkStatus`.
- Model `TenantMagicLink`.
- Relações com `Contract`, `Tenant`, `User` e `MaintenanceTicket`.
- Campo `tenantMagicLinkId` em `MaintenanceTicket`.
- Índices para contrato, locatário, status, expiração e hash do token.
- Novo tipo de auditoria `TENANT_MAGIC_LINK`.

## Rotas Internas

- `GET /api/contracts/:id/tenant-magic-link`: consulta o link atual do contrato.
- `POST /api/contracts/:id/tenant-magic-link`: gera novo link seguro.
- `POST /api/contracts/:id/tenant-magic-link/revoke`: revoga o link ativo.

## Rotas Públicas

- `GET /api/tenant-magic-links/overview`: consulta a visão pública pelo token.
- `POST /api/tenant-magic-links/maintenance-tickets`: abre chamado pelo token.

As rotas públicas recebem o token no cabeçalho `X-Tenant-Link-Token`.

## Frontend

- Página pública `/portal/locatario/link/:token`.
- Página pública `/portal/locatario/link/:token/chamados/novo`.
- Card de gestão do link no detalhe do contrato.
- Ações internas para gerar, copiar e revogar link.
- Textos das páginas públicas preparados em PT-BR, EN e ES.
- Interface visual isolada do shell administrativo para não misturar a área pública com o painel interno.

## Permissões

- `contracts.read`: permite visualizar o estado do link no detalhe do contrato.
- `contracts.generate`: permite gerar e revogar link.
- Usuários sem permissão não veem ações de gestão do link no frontend.
- Backend aplica as permissões nas rotas internas.
- Rotas públicas não exigem login, mas exigem token válido, ativo, não revogado e não expirado.

## Validação

Validação executada no fechamento do módulo:

- `npm run lint`: executado com sucesso.
- `npx prisma validate --config prisma.config.ts`: executado com sucesso.
- `npm run build`: executado com sucesso.
- `git diff --check`: executado com sucesso.
- `npm run db:migrate`: falhou no ambiente local com erro genérico do Prisma schema engine.
- Migration aplicada diretamente no PostgreSQL local para manter o ambiente testável.
- `GET /api/tenant-magic-links/overview` sem token retornou `401`, validando o bloqueio público básico.

Observação: a migration foi criada e versionada. O erro local ocorreu no schema engine do Prisma ao tentar aplicar a migration, não na validação do schema nem no build do projeto.

## Observações

- A área de documentos do locatário ficou preparada para liberação seletiva em módulo futuro.
- O chamado aberto pelo link fica vinculado ao contrato, imóvel, locatário e ao próprio magic link.
- O uso do usuário interno criador do link como responsável técnico pela abertura pública evita quebrar o modelo atual de `MaintenanceTicket`, que exige `openedByUserId`.
