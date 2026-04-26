# Módulo 2 - Imóvel 360

## Objetivo

Transformar o detalhe do imóvel em uma visão operacional única, sem duplicar cadastros nem criar novas tabelas.

## Estrutura da tela

- Visão geral: status, valores, proprietário, locatário atual e pendências.
- Fotos: galeria, capa, upload, remoção e ordenação quando permitido.
- Operação: ações rápidas, chaves, visitas e chamados.
- Contratos: contratos recentes e acesso ao contrato ativo.
- Histórico: últimos movimentos de visitas, contratos, chaves e chamados.
- Cadastro: características, descrição e observações internas.

## Dados reutilizados

O módulo usa `GET /api/properties/:id` e relações já existentes do imóvel:

- `propertyImages`
- `owner`
- `contracts`
- `propertyKeys`
- `keyControls`
- `visits`
- `maintenanceTickets`

## Permissões

A rota continua protegida por `properties.read`.

Os blocos sensíveis são retornados pelo backend apenas quando o usuário possui a permissão correspondente:

- Fotos: `propertyImages.read` ou `propertyImages.write`
- Chaves: `keys.read`
- Visitas: `visits.read`
- Contratos: `contracts.read`
- Locatário atual: `tenants.read` ou `contracts.read`
- Chamados: `maintenance.read`

## Observação

A rota `/imoveis/:propertyId/360` foi adicionada como alias visual da tela existente `/imoveis/:propertyId`, preservando compatibilidade com links antigos.
