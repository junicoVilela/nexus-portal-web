import { ParametrizacaoBlocoPagina } from './pagina-block-library.blocks';

export interface ColunaParametrizacao {
  key: string;
  rotulo: string;
  exemplo: string;
}

export interface ConfigParametrizacaoBloco {
  tituloDialogo: string;
  colunas: ColunaParametrizacao[];
  linhasPadrao: Record<string, string>[];
}

export const CONFIG_PARAMETRIZACAO: Record<ParametrizacaoBlocoPagina, ConfigParametrizacaoBloco> = {
  'acoes-tela': {
    tituloDialogo: 'Ações da tela',
    colunas: [
      { key: 'acao', rotulo: 'Ação', exemplo: 'Pesquisar' },
      { key: 'efeito', rotulo: 'Efeito', exemplo: 'Atualiza a listagem' },
      { key: 'quando', rotulo: 'Quando habilita', exemplo: 'Sempre' },
    ],
    linhasPadrao: [
      { acao: 'Pesquisar', efeito: 'Aplica os filtros e atualiza a listagem.', quando: 'Sempre' },
      { acao: 'Limpar', efeito: 'Remove filtros e restaura o estado inicial.', quando: 'Com critério preenchido' },
    ],
  },
  'mensagens-sistema': {
    tituloDialogo: 'Mensagens do sistema',
    colunas: [
      { key: 'mensagem', rotulo: 'Mensagem', exemplo: 'Texto exibido ao usuário' },
      { key: 'causa', rotulo: 'Causa provável', exemplo: 'Condição que gera a mensagem' },
      { key: 'acao', rotulo: 'O que fazer', exemplo: 'Correção ou próximo passo' },
    ],
    linhasPadrao: [
      {
        mensagem: 'Mensagem de erro ou alerta',
        causa: 'Condição que gera a mensagem.',
        acao: 'Correção ou próximo passo.',
      },
      { mensagem: 'Outra mensagem recorrente', causa: 'Origem da mensagem.', acao: 'Verificação ou suporte.' },
    ],
  },
  'campos-criticos': {
    tituloDialogo: 'Campos críticos',
    colunas: [
      { key: 'campo', rotulo: 'Campo', exemplo: 'Campo principal' },
      { key: 'importa', rotulo: 'Por que importa', exemplo: 'Sem este valor a operação não conclui' },
      { key: 'obrigatorio', rotulo: 'Obrigatório?', exemplo: 'Sim ou Não' },
    ],
    linhasPadrao: [
      { campo: 'Campo principal', importa: 'Sem este valor a operação não conclui.', obrigatorio: 'Sim' },
      { campo: 'Campo sensível', importa: 'Impacta risco, compliance ou integração.', obrigatorio: 'Sim' },
    ],
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function badgeObrigatorio(valor: string): string {
  const normalizado = valor.trim().toLowerCase();
  if (normalizado.startsWith('s')) {
    return '<span class="status-badge status-badge--sim">Sim</span>';
  }
  if (normalizado.startsWith('n')) {
    return '<span class="status-badge status-badge--nao">Não</span>';
  }
  return escapeHtml(valor);
}

export function montarHtmlParametrizado(tipo: ParametrizacaoBlocoPagina, linhas: Record<string, string>[]): string {
  const config = CONFIG_PARAMETRIZACAO[tipo];
  const linhasValidas = linhas.filter(linha => Object.values(linha).some(valor => valor.trim()));

  switch (tipo) {
    case 'acoes-tela':
      return (
        '<section class="doc-section"><h2>Ações da tela</h2><div class="table-wrap"><table><thead><tr>' +
        '<th>Ação</th><th>Efeito</th><th>Quando habilita</th></tr></thead><tbody>' +
        linhasValidas
          .map(
            linha =>
              `<tr><td><strong>${escapeHtml(linha['acao'] ?? '')}</strong></td><td>${escapeHtml(linha['efeito'] ?? '')}</td><td>${escapeHtml(linha['quando'] ?? '')}</td></tr>`,
          )
          .join('') +
        '</tbody></table></div></section>'
      );
    case 'mensagens-sistema':
      return (
        '<section class="doc-section"><h2>Mensagens do sistema</h2><div class="table-wrap"><table><thead><tr>' +
        '<th>Mensagem</th><th>Causa provável</th><th>O que fazer</th></tr></thead><tbody>' +
        linhasValidas
          .map(
            linha =>
              `<tr><td><strong>${escapeHtml(linha['mensagem'] ?? '')}</strong></td><td>${escapeHtml(linha['causa'] ?? '')}</td><td>${escapeHtml(linha['acao'] ?? '')}</td></tr>`,
          )
          .join('') +
        '</tbody></table></div></section>'
      );
    case 'campos-criticos':
      return (
        '<section class="doc-section"><h2>Campos críticos</h2><div class="table-wrap"><table><thead><tr>' +
        '<th>Campo</th><th>Por que importa</th><th>Obrigatório?</th></tr></thead><tbody>' +
        linhasValidas
          .map(
            linha =>
              `<tr><td><strong>${escapeHtml(linha['campo'] ?? '')}</strong></td><td>${escapeHtml(linha['importa'] ?? '')}</td><td>${badgeObrigatorio(linha['obrigatorio'] ?? '')}</td></tr>`,
          )
          .join('') +
        '</tbody></table></div></section>'
      );
    default:
      return '';
  }
}

export function clonarLinhasPadrao(tipo: ParametrizacaoBlocoPagina): Record<string, string>[] {
  return CONFIG_PARAMETRIZACAO[tipo].linhasPadrao.map(linha => ({ ...linha }));
}

export function linhaVazia(tipo: ParametrizacaoBlocoPagina): Record<string, string> {
  const colunas = CONFIG_PARAMETRIZACAO[tipo].colunas;
  return Object.fromEntries(colunas.map(coluna => [coluna.key, '']));
}
