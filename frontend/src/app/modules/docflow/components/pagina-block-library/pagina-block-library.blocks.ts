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
    id: 'elementos-numerados',
    nome: 'Elementos numerados',
    descricao: 'Explica os pontos marcados em uma captura.',
    categoria: 'Referência',
    visual: 'annotations',
    html: '<section class="doc-section"><h2>Elementos da tela</h2><div class="annotation-grid"><article class="annotation-card"><h3>Primeiro elemento</h3><p>Explique sua função e como utilizá-lo.</p></article><article class="annotation-card"><h3>Segundo elemento</h3><p>Registre regras e comportamentos.</p></article><article class="annotation-card"><h3>Terceiro elemento</h3><p>Descreva a ação disponível.</p></article></div></section>',
  },
  {
    id: 'regras',
    nome: 'Regras de negócio',
    descricao: 'Grade de validações, permissões e impactos.',
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
    html: '<section class="doc-section"><h2>Dicionário de campos</h2><div class="table-wrap"><table><thead><tr><th>#</th><th>Campo</th><th>Descrição</th><th>Obrigatório?</th><th>Exemplo</th><th>Impacto</th></tr></thead><tbody><tr><td><span class="number-badge">1</span></td><td><strong>Nome do campo</strong></td><td>Explique sua finalidade.</td><td><span class="status-badge status-badge--required">Sim</span></td><td>Valor de exemplo</td><td>Descreva o impacto no negócio.</td></tr></tbody></table></div></section>',
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
