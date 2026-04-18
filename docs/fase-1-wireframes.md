# FASE 1 - Wireframes Textuais

## Direcao visual global

- interface com base clara sofisticada, contraste controlado e acentos em verde petroleo, grafite e bronze suave;
- sidebar fixa no desktop com icones elegantes, bordas arredondadas amplas e estados ativos bem destacados;
- topbar com busca global, atalhos rapidos, notificacoes e menu de perfil;
- cards com sombra curta, superfice levemente aquecida e transicoes suaves;
- tabelas com cabecalho limpo, filtros persistentes, paginacao, densidade ajustavel e estados vazios amigaveis;
- responsividade priorizando desktop, com boa adaptacao para tablet por quebra em colunas e drawers.

## 1. Login

- tela em duas colunas no desktop;
- lado esquerdo com branding, headline comercial, beneficios do sistema e fundo com gradiente discreto;
- lado direito com card de acesso, campos de email e senha, checkbox de manter sessao, CTA primario e link para recuperacao;
- feedback de erro logo abaixo do campo, sem quebrar o layout;
- loading no botao com spinner e texto de autenticacao.

## 2. Recuperacao de senha

- card central com titulo claro, explicacao curta e campo de email;
- CTA primario para enviar link;
- bloco de confirmacao elegante apos envio;
- link de retorno ao login;
- fundo coerente com a identidade da tela de acesso.

## 3. Dashboard

- topo com saudacao, seletor de periodo, busca e resumo do dia;
- primeira faixa com cards de metricas:
  - imoveis disponiveis;
  - visitas do dia;
  - contratos ativos;
  - chaves em posse;
  - oportunidades em vendas;
  - oportunidades em locacao;
- segunda faixa com painel duplo:
  - pipeline resumido de vendas;
  - pipeline resumido de locacao;
- terceira faixa com:
  - tabela de visitas de hoje;
  - alertas de contratos proximos do vencimento;
  - alertas de chaves em posse excessiva;
- lateral direita opcional no desktop com atividade recente e tarefas pendentes.

## 4. Pipeline de Vendas

- cabecalho com titulo, contadores, filtros por corretor, origem, faixa de valor e botao de novo lead;
- area principal em kanban horizontal com colunas:
  - novo lead;
  - contato iniciado;
  - interesse confirmado;
  - visita agendada;
  - proposta enviada;
  - em negociacao;
  - documentacao;
  - fechado;
  - perdido;
- cada card mostra nome do cliente, imovel de interesse, valor, proxima acao e responsavel;
- clique no card abre drawer lateral com timeline, observacoes, visitas e acoes;
- drag and drop com validacao visual e confirmacao quando a mudanca exigir efeito colateral.

## 5. Pipeline de Locacao

- mesma linguagem do pipeline de vendas, com colunas especificas:
  - novo lead;
  - contato iniciado;
  - interesse confirmado;
  - visita agendada;
  - analise de perfil;
  - proposta;
  - documentacao;
  - contrato gerado;
  - assinatura pendente;
  - ativo;
  - perdido;
- drawer do lead com bloco de score cadastral, garantia preferida, visitas, documentos e CTA para gerar contrato;
- badges de risco para documentacao incompleta e score restrito.

## 6. Agenda / Visitas

- header com titulo, filtros por data, corretor, status e imovel;
- visao principal com alternancia entre calendario e tabela;
- tabela com colunas:
  - data e hora;
  - cliente;
  - imovel;
  - corretor;
  - status;
  - resultado;
- botao de nova visita abre modal com vinculo obrigatorio a imovel e lead;
- card de detalhe da visita com observacoes, comparecimento, desfecho e proxima acao.

## 7. Controle de Chaves

- topo com indicadores:
  - chaves disponiveis;
  - chaves retiradas;
  - chaves em manutencao;
  - alertas por atraso;
- tabela principal por chave fisica com:
  - identificador;
  - imovel;
  - status;
  - responsavel atual;
  - ultima retirada;
  - tempo em posse;
- botoes de retirada, devolucao e historico;
- retirada abre modal com responsavel, tipo de posse, horario e observacoes;
- se houver inconsistencia, exibir banner de bloqueio com CTA apenas para quem tem permissao de override;
- historico abre drawer com timeline completa.

## 8. Contratos Ativos

- header com filtros por status, vencimento, proprietario, locatario e imovel;
- cards superiores com:
  - ativos;
  - proximos do vencimento;
  - em assinatura;
  - renovacoes pendentes;
- tabela com colunas:
  - codigo;
  - locador;
  - locatario;
  - imovel;
  - inicio;
  - fim;
  - aluguel;
  - status;
- linha expandivel ou drawer com resumo financeiro, garantia, reajuste e versoes.

## 9. Proprietarios

- pagina de listagem com filtros por nome, documento, status e quantidade de imoveis;
- tabela com nome, documento, contato principal, quantidade de imoveis e ultimo contrato;
- botao de novo proprietario abre drawer;
- detalhe do proprietario com tabs:
  - dados cadastrais;
  - endereco;
  - dados bancarios;
  - imoveis vinculados;
  - historico contratual;
  - documentos.

## 10. Locatarios

- listagem semelhante a proprietarios, com score cadastral destacado por badge;
- tabela com nome, CPF, contato, score e contratos;
- detalhe com tabs:
  - cadastro;
  - endereco;
  - documentos;
  - contratos vinculados;
  - historico;
- CTA para iniciar lead de locacao ou vincular a contrato permitido conforme papel.

## 11. Imoveis

- topo com filtros por finalidade, status, tipo, bairro e faixa de valor;
- grade alternavel entre cards e tabela;
- card de imovel com foto principal, status comercial, valor e atributos principais;
- tabela com codigo, endereco resumido, proprietario, finalidade, valor e status;
- CTA para novo imovel com formulario em steps ou secoes;
- destaque visual para imoveis vendidos, alugados e em manutencao.

## 12. Usuarios

- listagem administrativa com nome, email, perfil, status e ultimo acesso;
- filtros por perfil e status;
- acoes de ativar, inativar, redefinir senha e editar perfil;
- drawer de cadastro com dados basicos, papeis e permissoes herdadas;
- bloco lateral com historico simples de auditoria do usuario.

## 13. Configuracoes

- pagina segmentada em cards ou tabs:
  - empresa;
  - perfis e permissoes;
  - templates de contrato;
  - parametros operacionais;
  - notificacoes;
- acesso restrito;
- formularios com ajuda contextual e resumo do impacto das alteracoes.

## 14. Detalhe do Imovel

- hero com carousel de fotos, status comercial, codigo, endereco e CTA principal;
- faixa de cards com valor, finalidade, proprietario e disponibilidade;
- conteudo em abas:
  - visao geral;
  - caracteristicas;
  - visitas;
  - leads relacionados;
  - chaves;
  - contratos;
  - documentos;
  - observacoes internas;
- painel lateral com acoes rapidas como editar, registrar visita, registrar chave e iniciar proposta.

## 15. Detalhe do Lead

- cabecalho com nome do cliente, etapa atual, responsavel e resumo do interesse;
- timeline vertical das mudancas de etapa;
- cards de contato, imovel de interesse, agenda e proxima acao;
- abas:
  - historico;
  - visitas;
  - documentos;
  - observacoes;
  - proposta;
- no lead de locacao, mostrar bloco de analise de perfil e CTA para gerar contrato quando elegivel.

## 16. Detalhe do Contrato

- cabecalho com codigo, status, locador, locatario e imovel;
- faixa de resumo com vigencia, aluguel, garantia, reajuste e vencimento;
- alertas visiveis para vencimento proximo ou pendencia de revisao;
- abas:
  - dados gerais;
  - clausulas;
  - versoes;
  - documentos;
  - auditoria;
- lista de versoes com nome do template, data, responsavel, status e botoes para visualizar e exportar.

## 17. Gerador de Contrato

- fluxo em stepper no topo:
  - dados base;
  - parametros;
  - clausulas adicionais;
  - revisao;
  - exportacao;
- layout em duas colunas:
  - esquerda com formulario parametrico;
  - direita com preview da minuta em tempo quase real;
- aviso juridico sempre visivel informando que a minuta deve ser validada juridicamente antes do uso final;
- bloco de versao com numero, template, responsavel pela revisao e historico;
- botoes finais para salvar versao, marcar como revisado e exportar PDF.

## 18. Adaptacao para tablet

- sidebar colapsavel em drawer;
- cards empilhados em uma coluna;
- grids de dashboard quebrando para duas colunas;
- drawers ocupando largura maior;
- tabelas com colunas prioritarias e acoes em menu contextual.
