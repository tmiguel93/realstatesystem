# Módulo 3 — Contatos Unificados com Papéis

## Objetivo

Centralizar pessoas em uma visão única de contatos, reduzindo cadastros duplicados entre proprietários, locatários, compradores, fiadores e corretores externos.

## Implementado

- Nova entidade `Contact` para cadastros unificados.
- Nova entidade `ContactRole` para múltiplos papéis por contato.
- Vínculo opcional de `Owner` e `Tenant` com `Contact`, preservando as tabelas existentes.
- Diretório de contatos que também reaproveita proprietários e locatários legados ainda não vinculados.
- Busca por nome, CPF/CNPJ, e-mail e telefone.
- Filtro por papel e status.
- Prevenção de duplicidade por CPF/CNPJ, e-mail e telefone.
- API REST protegida por RBAC.
- Menu e rota protegida no frontend.
- Tela operacional com métricas, filtros, tabela, skeleton de carregamento e empty state.
- Drawer para criação e edição de contatos unificados com formulário em grid.

## Modelagem

### Contact

- `id`
- `personType`
- `fullName`
- `document`
- `email`
- `phone`
- `secondaryPhone`
- `zipCode`
- `state`
- `city`
- `district`
- `street`
- `streetNumber`
- `complement`
- `notes`
- `isActive`
- `createdAt`
- `updatedAt`

### ContactRole

- `contactId`
- `role`
- `assignedAt`

### Papéis

- `OWNER`: Proprietário
- `TENANT`: Locatário
- `BUYER`: Comprador
- `GUARANTOR`: Fiador
- `EXTERNAL_BROKER`: Corretor externo

## Permissões

- `contacts.read`: leitura do diretório unificado de contatos.
- `contacts.write`: criação e edição de contatos unificados.

Perfis atualizados:

- MASTER: acesso total.
- Usuário operacional: leitura e escrita.
- Atendente de locação: leitura e escrita.
- Corretor: leitura.
- Setor de manutenção: leitura.

## Rotas

### Backend

- `GET /api/contacts`
- `POST /api/contacts`
- `PATCH /api/contacts/:id`

### Frontend

- `/contatos`

## Validação

- `npm run db:generate`: executado com sucesso.
- `npm run lint`: executado com sucesso.
- `npm run build`: executado com sucesso.
- `npx prisma validate --config prisma.config.ts`: executado com sucesso.

Observação: `npm run db:push` foi tentado, mas o Prisma retornou apenas `Schema engine error` sem detalhe. O schema está válido e a migration SQL foi criada em `apps/api/prisma/migrations/20260502153000_add_contacts_unified_roles/migration.sql`.

## Decisão arquitetural

A unificação foi implementada de forma incremental. Proprietários e locatários continuam existindo para preservar contratos, imóveis, manutenção e portal do locatário. A nova camada `Contact` permite evoluir para uma base única sem quebrar regras de negócio existentes.
