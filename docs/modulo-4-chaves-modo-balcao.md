# Módulo 4 — Controle de Chaves em Modo Balcão

## Objetivo

Transformar o controle de chaves em uma rotina rápida de atendimento, com busca única, status visual, ações diretas e histórico sem sair da tela.

## Implementado

- Tela de chaves redesenhada como modo balcão em `/chaves`.
- Busca grande por imóvel, endereço, identificador da chave, portador ou documento.
- Filtros rápidos: todas, disponíveis, fora, atrasadas e imóveis sem chave.
- Cards operacionais com status visual e próxima ação recomendada.
- Resultado rápido de imóveis, incluindo imóveis sem chave cadastrada.
- Ação direta para registrar chave recebida a partir de imóvel sem chave.
- Painel lateral de atendimento atual com resumo, endereço, portador, prazo e histórico.
- Botões contextuais de retirada, devolução e alteração de status.
- Ocultação de ações de escrita para usuários sem `keys.write`.
- Ocultação de campos de override para usuários sem `keys.override`.
- Formulário de retirada com finalidade operacional.
- Formulário de devolução com responsável pelo recebimento e estado da chave.
- Backend com validações de coerência temporal para retirada/devolução.
- Resultado da API de chaves enriquecido com endereço do imóvel.

## Regras Operacionais

- Chaves disponíveis ou cópias podem ser retiradas.
- Chaves fora aparecem como `Fora`.
- Chaves com prazo vencido aparecem como `Atrasada`.
- Chaves bloqueadas, perdidas ou em manutenção aparecem como `Indisponível`.
- Imóvel sem `PropertyKey` aparece como `Sem chave`.
- Retirada futura é bloqueada.
- Previsão de devolução precisa ser posterior à retirada.
- Devolução não pode ser anterior à retirada registrada.
- Override continua bloqueado no backend para quem não tem `keys.override`.

## Permissões

- `keys.read`: acessa a tela e histórico.
- `keys.write`: cria chave, registra retirada, devolução e status.
- `keys.override`: visualiza campo de justificativa de override e consegue executar override no backend.

## Validação

- `npm run lint`: executado com sucesso.
- `npm run build`: executado com sucesso.

## Observações

O módulo reaproveita `PropertyKey` e `KeyControl`, preservando o histórico atual e evitando alteração estrutural no banco. A melhoria principal é de fluxo operacional e segurança de validação.
