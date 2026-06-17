export type StatusPagina = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'PUBLICADO' | 'ARQUIVADO';

export interface Pagina {
  id: string;
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
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PaginaAnexo {
  id: string;
  paginaId: string;
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
