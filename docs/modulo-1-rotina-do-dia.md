# Módulo 1 - Rotina do Dia no Dashboard

## Objetivo

Adicionar ao dashboard uma visão operacional curta e acionável para a rotina diária da imobiliária.

## Itens exibidos

- Visitas de hoje.
- Chaves fora.
- Contratos vencendo.
- Chamados críticos.
- Leads sem retorno.

## Regras de alerta

- Atrasado: item com prazo ou retorno vencido.
- Vence hoje: item com ação prevista para o dia atual.
- Urgente: chamado crítico por urgência alta.
- Sem responsável: chave ou chamado sem responsável definido.

## Permissão

A rota backend e a tela usam a permissão `dashboard.read`, preservando a regra já existente para acesso ao dashboard.

## Endpoint

`GET /api/dashboard/daily-routine`

O endpoint agrega dados já existentes, sem criar novas tabelas ou alterar o schema do banco.
