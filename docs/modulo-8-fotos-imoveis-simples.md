# Módulo 8 - Fotos Simples de Imóveis

## Objetivo

Completar o fluxo simples de fotos de imóveis com foco operacional: foto de capa, galeria, ordenação, remoção, preview antes do envio e identificação rápida de imóveis sem foto.

## Implementado

- Upload de múltiplas fotos no detalhe do imóvel.
- Preview local das fotos antes do envio.
- Validação frontend de quantidade, tipo e tamanho.
- Validação backend de tipo de imagem e limite de upload já existente.
- Foto de capa automática na primeira imagem quando o imóvel ainda não possui capa.
- Ação para definir outra imagem como capa.
- Remoção de fotos da galeria.
- Se a capa for removida, a próxima imagem vira capa automaticamente.
- Reordenação simples da galeria por botões de mover para esquerda/direita.
- Filtro "Somente sem foto" na listagem de imóveis.
- Contador de imóveis sem foto nos cards do portfólio.
- Contagem de fotos por imóvel na tabela.
- Placeholder elegante para imóvel sem foto no detalhe e na listagem.
- Estado de permissão na aba Fotos quando o usuário pode ver o imóvel, mas não pode acessar a galeria.

## Backend

O backend já possuía o modelo `PropertyImage` e os endpoints principais de imagem. O módulo incrementou:

- Filtro `withoutImages` em `GET /api/properties`.
- Resumo `summary.withoutImages` na resposta da listagem.
- `imageCount` nos itens da listagem.
- `imageCount` nas métricas do detalhe do imóvel.
- Checagem do imóvel antes de salvar arquivos no storage.
- Limpeza dos arquivos salvos caso a criação das imagens falhe.
- Bloqueio de lista duplicada na reordenação.
- Bloqueio para não desmarcar manualmente a única capa atual via API.

## Frontend

- O painel `PropertyImagesPanel` segue dentro da aba Fotos do Imóvel 360.
- A listagem de imóveis ganhou filtro rápido para imóveis sem foto.
- A tabela agora exibe contagem de fotos ou aviso "Sem foto cadastrada".
- O upload exibe preview, total selecionado e mensagens de erro antes de chamar o backend.
- Os botões de capa, ordenação e remoção respeitam estados de carregamento.

## Permissões

- `properties.read`: permite acessar a listagem e o detalhe do imóvel.
- `propertyImages.read`: permite visualizar a galeria no detalhe.
- `propertyImages.write`: permite upload, capa, ordenação e remoção.
- Usuário sem permissão de imagem não vê a galeria real na aba Fotos.
- Backend continua protegendo upload, edição, reordenação e remoção com `propertyImages.write`.

## Validação

Validação executada no fechamento do módulo:

- `npm run lint`: executado com sucesso.
- `npm run build`: executado com sucesso.
- `npx prisma validate --config prisma.config.ts`: executado com sucesso.
- `git diff --check`: executado com sucesso.

Observação: não foi criada migration neste módulo porque `PropertyImage` já existia no schema atual. A tentativa de validar endpoint em `localhost:3333` não foi executada porque a API local não estava em execução no momento do fechamento.

## Próximos Cuidados

- Avaliar assinatura temporária ou proteção de acesso para `/uploads` caso as fotos deixem de ser públicas.
- Criar limpeza periódica de arquivos órfãos no storage local.
- Em ambiente de produção, migrar o storage local para S3 ou serviço equivalente mantendo o adapter atual.
