export type CategoriaBlocoPagina = 'Estrutura' | 'Orientação' | 'Referência' | 'Navegação';

export interface BlocoPagina {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaBlocoPagina;
  visual: string;
  html: string;
}

export const BLOCOS_PAGINA: readonly BlocoPagina[] = [
  {
    id: 'introducao',
    nome: 'Introdução editorial',
    descricao: 'Contexto, tipo de conteúdo e resumo da página.',
    categoria: 'Estrutura',
    visual: 'intro',
    html: '<section class="doc-intro"><span class="doc-kicker">Visão geral</span><h2>Título da introdução</h2><p>Apresente o contexto e o resultado que o usuário encontrará nesta página.</p></section>',
  },
  {
    id: 'objetivo',
    nome: 'Objetivo de negócio',
    descricao: 'Destaca o propósito e o impacto da funcionalidade.',
    categoria: 'Orientação',
    visual: 'objective',
    html: '<div class="objective-card"><p><strong>Objetivo de negócio</strong></p><p>Explique o valor desta funcionalidade e o resultado esperado.</p></div>',
  },
  {
    id: 'visao-tela',
    nome: 'Visão da tela',
    descricao: 'Área preparada para inserir uma captura do sistema.',
    categoria: 'Estrutura',
    visual: 'screen',
    html: '<section class="doc-section"><h2>Visão da tela</h2><figure class="screen-frame"><div class="screen-placeholder"><p><strong>Insira aqui uma captura da tela</strong></p><p><span>Use a ferramenta de imagem do editor.</span></p></div><figcaption>Descreva o que esta tela apresenta.</figcaption></figure></section>',
  },
  {
    id: 'elementos-tela-toda',
    nome: 'Elementos · 1 card tela toda',
    descricao: 'Um único card ocupando a linha inteira.',
    categoria: 'Referência',
    visual: 'annotations',
    html: '<section class="doc-section"><h2>Elementos da tela</h2><div class="annotation-grid annotation-grid--1"><article class="annotation-card"><h3>Filtros</h3><p>Descreva os principais critérios de pesquisa, combinações e valores padrão.</p></article></div></section>',
  },
  {
    id: 'elementos-um-meia-tela',
    nome: 'Elementos · 1 card meia tela',
    descricao: 'Um único card com metade da largura (coluna esquerda).',
    categoria: 'Referência',
    visual: 'annotations',
    html: '<section class="doc-section"><h2>Elementos da tela</h2><div class="annotation-grid annotation-grid--half"><article class="annotation-card"><h3>Filtros</h3><p>Descreva os principais critérios de pesquisa, combinações e valores padrão.</p></article></div></section>',
  },
  {
    id: 'elementos-meia-tela',
    nome: 'Elementos · 2 cards meia tela',
    descricao: 'Dois cards lado a lado (metade da largura cada).',
    categoria: 'Referência',
    visual: 'annotations',
    html: '<section class="doc-section"><h2>Elementos da tela</h2><div class="annotation-grid annotation-grid--2"><article class="annotation-card"><h3>Filtros</h3><p>Descreva os principais critérios de pesquisa.</p></article><article class="annotation-card"><h3>Pesquisar e limpar</h3><p>Explique o comportamento de cada ação.</p></article></div></section>',
  },
  {
    id: 'elementos-3-colunas',
    nome: 'Elementos · 3 colunas',
    descricao: 'Três cards em grade — padrão para pontos numerados da captura.',
    categoria: 'Referência',
    visual: 'annotations',
    html: '<section class="doc-section"><h2>Elementos da tela</h2><div class="annotation-grid annotation-grid--3"><article class="annotation-card"><h3>Primeiro elemento</h3><p>Explique sua função e como utilizá-lo.</p></article><article class="annotation-card"><h3>Segundo elemento</h3><p>Registre regras e comportamentos.</p></article><article class="annotation-card"><h3>Terceiro elemento</h3><p>Descreva a ação disponível.</p></article></div></section>',
  },
  {
    id: 'regras',
    nome: 'Regras de negócio',
    descricao: 'Grade de validações, permissões e impactos (3 colunas). Troque content-grid--3 por --1 ou --2 para mudar o layout.',
    categoria: 'Orientação',
    visual: 'rules',
    html: '<section class="doc-section"><h2>Regras de negócio</h2><div class="content-grid content-grid--3"><article class="rule-card"><h3>Validação</h3><p>Descreva a condição obrigatória.</p></article><article class="rule-card"><h3>Permissão</h3><p>Informe quem pode executar a ação.</p></article><article class="rule-card"><h3>Impacto</h3><p>Explique o efeito no processo.</p></article></div></section>',
  },
  {
    id: 'fluxo',
    nome: 'Fluxo horizontal',
    descricao: 'Quatro etapas conectadas de um procedimento.',
    categoria: 'Estrutura',
    visual: 'flow',
    html: '<section class="doc-section"><h2>Etapas do processo</h2><ol class="flow-strip"><li><strong>Início</strong><span>Explique a entrada.</span></li><li><strong>Análise</strong><span>Descreva a validação.</span></li><li><strong>Decisão</strong><span>Informe o responsável.</span></li><li><strong>Conclusão</strong><span>Registre o resultado.</span></li></ol></section>',
  },
  {
    id: 'jornada',
    nome: 'Jornada inicial',
    descricao: 'Sequência de cinco cards para onboarding.',
    categoria: 'Estrutura',
    visual: 'journey',
    html: '<section class="doc-section"><h2>Jornada inicial</h2><div class="journey-grid"><article class="journey-card"><span class="journey-card__number">1</span><h3>Primeiro acesso</h3><p>Oriente o início.</p></article><article class="journey-card"><span class="journey-card__number">2</span><h3>Segurança</h3><p>Proteja a conta.</p></article><article class="journey-card"><span class="journey-card__number">3</span><h3>Configuração</h3><p>Ajuste preferências.</p></article><article class="journey-card"><span class="journey-card__number">4</span><h3>Primeira tarefa</h3><p>Realize uma ação.</p></article><article class="journey-card"><span class="journey-card__number">5</span><h3>Resultado</h3><p>Consulte informações.</p></article></div></section>',
  },
  {
    id: 'dicionario',
    nome: 'Dicionário de campos',
    descricao: 'Tabela com obrigatoriedade, exemplo e impacto.',
    categoria: 'Referência',
    visual: 'table',
    html: '<section class="doc-section"><h2>Dicionário de campos</h2><div class="table-wrap"><table><thead><tr><th>#</th><th>Campo</th><th>Descrição</th><th>Obrigatório?</th><th>Exemplo</th><th>Impacto</th></tr></thead><tbody><tr><td><span class="number-badge">1</span></td><td><strong>Nome do campo</strong></td><td>Explique sua finalidade.</td><td><span class="status-badge status-badge--sim">Sim</span></td><td>Valor de exemplo</td><td>Descreva o impacto no negócio.</td></tr><tr><td><span class="number-badge">2</span></td><td><strong>Outro campo</strong></td><td>Detalhe regras e limites.</td><td><span class="status-badge status-badge--nao">Não</span></td><td>Valor de exemplo</td><td>Informe o efeito no processo.</td></tr></tbody></table></div></section>',
  },
  {
    id: 'badge-sim',
    nome: 'Badge · Sim',
    descricao: 'Selo azul — clique na célula e depois neste bloco.',
    categoria: 'Referência',
    visual: 'table',
    html: '<span class="status-badge status-badge--sim">Sim</span>',
  },
  {
    id: 'badge-nao',
    nome: 'Badge · Não',
    descricao: 'Selo cinza — clique na célula e depois neste bloco.',
    categoria: 'Referência',
    visual: 'table',
    html: '<span class="status-badge status-badge--nao">Não</span>',
  },
  {
    id: 'badge-ativo',
    nome: 'Badge · Ativo',
    descricao: 'Selo verde — clique na célula e depois neste bloco.',
    categoria: 'Referência',
    visual: 'table',
    html: '<span class="status-badge status-badge--ativo">Ativo</span>',
  },
  {
    id: 'badge-inativo',
    nome: 'Badge · Inativo',
    descricao: 'Selo neutro — clique na célula e depois neste bloco.',
    categoria: 'Referência',
    visual: 'table',
    html: '<span class="status-badge status-badge--inativo">Inativo</span>',
  },
  {
    id: 'badge-pendente',
    nome: 'Badge · Pendente',
    descricao: 'Selo amarelo de atenção.',
    categoria: 'Referência',
    visual: 'table',
    html: '<span class="status-badge status-badge--warn">Pendente</span>',
  },
  {
    id: 'badge-bloqueado',
    nome: 'Badge · Bloqueado',
    descricao: 'Selo vermelho de bloqueio.',
    categoria: 'Referência',
    visual: 'table',
    html: '<span class="status-badge status-badge--danger">Bloqueado</span>',
  },
  {
    id: 'badges-status',
    nome: 'Tabela de exemplos de badges',
    descricao: 'Insere uma tabela-demo. Para um selo na célula, use Badge · Sim/Não/…',
    categoria: 'Referência',
    visual: 'table',
    html:
      '<section class="doc-section"><h2>Status e flags</h2><div class="table-wrap"><table><thead><tr><th>Campo</th><th>Valor</th><th>Quando usar</th></tr></thead><tbody>' +
      '<tr><td><strong>Obrigatório</strong></td><td><span class="status-badge status-badge--sim">Sim</span></td><td>Campo exigido para salvar.</td></tr>' +
      '<tr><td><strong>Obrigatório</strong></td><td><span class="status-badge status-badge--nao">Não</span></td><td>Campo opcional.</td></tr>' +
      '<tr><td><strong>Situação</strong></td><td><span class="status-badge status-badge--ativo">Ativo</span></td><td>Registro disponível para uso.</td></tr>' +
      '<tr><td><strong>Situação</strong></td><td><span class="status-badge status-badge--inativo">Inativo</span></td><td>Registro desligado.</td></tr>' +
      '<tr><td><strong>Alerta</strong></td><td><span class="status-badge status-badge--warn">Pendente</span></td><td>Aguarda revisão.</td></tr>' +
      '<tr><td><strong>Bloqueio</strong></td><td><span class="status-badge status-badge--danger">Bloqueado</span></td><td>Não pode ser usado.</td></tr>' +
      '</tbody></table></div></section>',
  },
  {
    id: 'lista-recursos',
    nome: 'Lista de conteúdos',
    descricao: 'Índice de guias com resumo e metadados.',
    categoria: 'Navegação',
    visual: 'list',
    html: '<section class="doc-section"><h2>Conteúdos disponíveis</h2><div class="resource-list resource-list--large"><article class="resource-item"><span class="number-badge">1</span><span><strong>Nome do primeiro guia</strong><small>Resuma o conteúdo em uma frase.</small></span><span class="resource-item__meta">6 min · guia</span></article><article class="resource-item"><span class="number-badge">2</span><span><strong>Nome do segundo guia</strong><small>Explique o benefício para o usuário.</small></span><span class="resource-item__meta">8 min · referência</span></article></div></section>',
  },
  {
    id: 'faq',
    nome: 'Perguntas frequentes',
    descricao: 'Grupo de dúvidas com respostas objetivas.',
    categoria: 'Referência',
    visual: 'faq',
    html: '<section class="doc-section"><h2>Perguntas frequentes</h2><div class="faq-list"><article class="faq-item"><h3>Como realizar esta operação?</h3><p>Responda de forma direta e indique o caminho.</p></article><article class="faq-item"><h3>O que fazer em caso de erro?</h3><p>Informe as verificações iniciais.</p></article></div></section>',
  },
  {
    id: 'checklist-status',
    nome: 'Checklist de progresso',
    descricao: 'Itens concluídos, em andamento e pendentes.',
    categoria: 'Orientação',
    visual: 'status',
    html: '<section class="doc-section"><h2>Checklist</h2><ul class="status-list"><li class="status-item status-item--done"><span>Primeira atividade</span><strong>Concluído</strong></li><li class="status-item status-item--progress"><span>Segunda atividade</span><strong>Em andamento</strong></li><li class="status-item"><span>Terceira atividade</span><strong>Pendente</strong></li></ul></section>',
  },
  {
    id: 'boas-praticas',
    nome: 'Boas práticas',
    descricao: 'Recomendações rápidas em cards.',
    categoria: 'Orientação',
    visual: 'cards',
    html: '<section class="doc-section"><h2>Boas práticas</h2><div class="content-grid content-grid--3"><article class="topic-card"><span class="topic-card__icon">01</span><h3>Planeje antes</h3><p>Defina o objetivo da atividade.</p></article><article class="topic-card"><span class="topic-card__icon">02</span><h3>Revise os dados</h3><p>Confirme informações importantes.</p></article><article class="topic-card"><span class="topic-card__icon">03</span><h3>Compartilhe</h3><p>Comunique o resultado às pessoas certas.</p></article></div></section>',
  },
  {
    id: 'links-relacionados',
    nome: 'Links relacionados',
    descricao: 'Navegação para guias complementares.',
    categoria: 'Navegação',
    visual: 'links',
    html: '<div class="related-links"><p><strong>Guias relacionados</strong><span>Primeiro conteúdo relacionado</span><span>Segundo conteúdo relacionado</span><span>Terceiro conteúdo relacionado</span></p></div>',
  },
] as const;
