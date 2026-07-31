export type StatusPublicacao = 'GERANDO' | 'SUCESSO' | 'ERRO';

export interface Publicacao {
  id: string;
  clienteId: string;
  clienteNome: string;
  versao: string;
  status: StatusPublicacao;
  quantidadePaginas: number;
  quantidadeModulos: number;
  arquivoZipNome?: string;
  hashPacote?: string;
  observacao?: string;
  relatorioValidacao?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ReprocessamentoPublicacoes {
  solicitadas: number;
  reprocessadas: number;
  ignoradas: number;
  publicacoes: Publicacao[];
}

export interface PublicacaoPaginaSnapshot {
  id: string;
  parentId?: string | null;
  titulo: string;
  codigoTela?: string;
  slug?: string;
  ordem: number;
  nivel: number;
}
