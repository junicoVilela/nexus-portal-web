import { AiPaginaDocumento, AiPaginaPlanoOrigem } from '../../models/ai-documento-importacao.model';

export function extrairConteudoPagina(briefing: string): string {
  return briefing
    .replace(/^# Projeto:[^\r\n]*(?:\r?\n)+## Módulo:[^\r\n]*(?:\r?\n)+### Página:[^\r\n]*(?:\r?\n)+/s, '')
    .trim();
}

export function montarBriefingPagina(
  projetoNome: string,
  moduloNome: string,
  titulo: string,
  conteudo: string,
): string {
  return `# Projeto: ${projetoNome}\n\n## Módulo: ${moduloNome}\n\n### Página: ${titulo}\n\n${conteudo.trim()}`;
}

export function paginaPodeSerEditada(pagina: AiPaginaDocumento): boolean {
  return pagina.status === 'PENDENTE' && pagina.paginaId === null && pagina.sessaoId === null;
}

export function rotuloOrigemPagina(origem: AiPaginaPlanoOrigem): string {
  switch (origem) {
    case 'IA':
      return 'Sugerida pela IA';
    case 'MANUAL':
      return 'Criada manualmente';
    case 'DIVISAO':
      return 'Criada por divisão';
    case 'MESCLAGEM':
      return 'Conteúdo mesclado';
    default:
      return 'Extraída do documento';
  }
}
