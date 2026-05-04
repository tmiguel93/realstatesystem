# Módulo 9 - Menus Enxutos por Perfil

## Objetivo

Reduzir o ruído visual do menu lateral para que cada perfil veja somente os módulos mais úteis da rotina diária, mantendo as rotas e APIs protegidas por permissões reais.

## Implementado

- Matriz de menu por perfil no sidebar.
- Filtro final por permissão em cada item do menu.
- Redirecionamento inicial por perfil:
  - Master e usuário operacional entram no dashboard.
  - Corretor entra em imóveis.
  - Atendente de locação entra em locações.
  - Setor de manutenção entra em chamados.
  - Locatário entra no portal do locatário.
- Menu de manutenção direcionado para chamados nos perfis operacionais.
- Ocultação de itens pouco usados no dia a dia, como proprietários e locatários separados, priorizando contatos unificados.
- Topbar passou a exibir nomes amigáveis dos perfis em vez de códigos técnicos.
- Subnavegação de manutenção esconde "Abrir chamado" para usuário sem `maintenance.write`.
- Detalhe de chamado esconde painel de movimentação para usuário sem `maintenance.write`.
- Kanban de manutenção esconde movimentação rápida para usuário sem `maintenance.write`.
- Listagem de imóveis esconde "Novo imóvel", "Editar" e CTA de cadastro para usuário sem `properties.write`.

## Menus por Perfil

### MASTER

- Dashboard.
- Contatos.
- Imóveis.
- Vendas.
- Locação.
- Visitas.
- Chaves.
- Manutenção.
- Contratos.
- Usuários.
- Perfis e permissões.
- Preferências/configurações.

### Usuário Operacional

- Dashboard.
- Vendas.
- Locação.
- Visitas.
- Chaves.
- Chamados.
- Contratos.
- Imóveis.
- Contatos.

### Corretor

- Vendas.
- Locação.
- Visitas.
- Imóveis.
- Contatos.

### Atendente de Locação

- Locação.
- Visitas.
- Chaves.
- Contratos.
- Chamados.
- Imóveis.
- Contatos.

### Setor de Manutenção

- Chamados.
- Imóveis.
- Contatos.
- Contratos.

### Portal do Locatário

- Portal do locatário.

## Segurança e Permissões

- O menu é apenas camada visual.
- As rotas continuam protegidas por `PermissionGuard`.
- As APIs continuam protegidas por `requireAuth` e `requirePermissions`.
- O backend não foi relaxado neste módulo.
- Proprietários e locatários continuam acessíveis por rota manual quando o perfil possuir permissão, mas deixam de ocupar espaço no menu principal porque o módulo de contatos unificados reduz duplicidade.

## Validação

Validação executada no fechamento do módulo:

- `npm run lint`: executado com sucesso.
- `npm run build`: executado com sucesso.
- `npx prisma validate --config prisma.config.ts`: executado com sucesso.
- `git diff --check`: executado com sucesso.

## Observações

- Não houve alteração de banco de dados.
- Não houve alteração nas permissões do backend.
- O build mantém o aviso já existente de bundle grande no Vite, sem quebrar a compilação.
