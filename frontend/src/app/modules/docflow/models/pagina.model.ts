export type StatusPagina = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'PUBLICADO' | 'ARQUIVADO';

export interface Pagina {
  id: string;
  version: number;
  titulo: string;
  slug: string;
  codigoTela: string;
  resumo?: string;
  conteudoHtml?: string;
  status: StatusPagina;
  ordem: number;
  ativo: boolean;
  moduloId: string;
  moduloNome: string;
  projetoId: string;
  projetoNome: string;
  parentId?: string;
  parentTitulo?: string;
  templateOrigemId?: string;
  templateOrigemVersao?: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PaginaAnexo {
  id: string;
  paginaId: string;
  paginaTitulo?: string;
  nomeOriginal: string;
  contentType: string;
  tamanhoBytes: number;
  createdAt: string;
  createdBy?: string;
  downloadUrl: string;
}

export interface PaginaRevisao {
  id: string;
  numero: number;
  titulo: string;
  status: StatusPagina;
  tipo:
    | 'CRIACAO'
    | 'SALVAMENTO_MANUAL'
    | 'RETORNO_RASCUNHO'
    | 'ENVIO_REVISAO'
    | 'APROVACAO'
    | 'PUBLICACAO'
    | 'ARQUIVAMENTO'
    | 'DUPLICACAO'
    | 'COMENTARIO';
  descricao?: string;
  resumo?: string;
  conteudoHtml?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PaginaQualidadeItem {
  codigo: string;
  titulo: string;
  descricao: string;
  ok: boolean;
  severidade: 'ERRO' | 'AVISO';
}

export interface PaginaQualidade {
  aptoParaRevisao: boolean;
  concluidos: number;
  total: number;
  itens: PaginaQualidadeItem[];
}

export interface PaginaTemplate {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  conteudoHtml: string;
  ordem: number;
  ativo?: boolean;
  personalizado?: boolean;
  versaoAtual?: number;
  paginasOriginadas?: number;
  projetoId?: string;
  projetoNome?: string;
  clienteId?: string;
  clienteNome?: string;
}

export interface PaginaTemplateCriacao {
  nome: string;
  descricao?: string;
  conteudoHtml: string;
  projetoId?: string;
  clienteId?: string;
}

export interface PaginaTemplateDuplicacao {
  nome: string;
  projetoId?: string;
  clienteId?: string;
}

export interface PaginaTemplateAplicacao {
  projetoId?: string;
  moduloId?: string;
  clienteId?: string;
  titulo?: string;
  codigoTela?: string;
}

export interface PaginaTemplateAplicada {
  templateId: string;
  versao: number;
  conteudoHtml: string;
  variaveisResolvidas: Record<string, string>;
  variaveisPendentes: string[];
}

export interface PaginaTemplateVersao {
  id: string;
  numero: number;
  nome: string;
  descricao?: string;
  conteudoHtml: string;
  ativo: boolean;
  projetoId?: string;
  clienteId?: string;
  paginasOriginadas: number;
  createdAt: string;
  createdBy?: string;
}

export interface ChangelogItem {
  id: string;
  paginaId?: string;
  paginaTitulo: string;
  tipoMudanca: 'ADICIONADO' | 'ATUALIZADO' | 'REMOVIDO';
  createdAt: string;
}
