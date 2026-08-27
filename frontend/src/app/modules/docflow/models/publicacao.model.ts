export type StatusPublicacao = 'GERANDO' | 'SUCESSO' | 'ERRO' | 'CANCELADA';

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
  /** Cancelamento pedido: o worker ainda está terminando de gerar. */
  cancelamentoSolicitado: boolean;
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

export type MudancaPublicacao =
  | 'ADICIONADA'
  | 'REMOVIDA'
  | 'ALTERADA'
  | 'MOVIDA'
  | 'INALTERADA'
  /** Publicação gerada antes do hash de conteúdo existir: não dá para afirmar se mudou. */
  | 'INDETERMINADA';

export interface PublicacaoDiffItem {
  paginaId: string;
  titulo: string;
  codigoTela?: string;
  mudanca: MudancaPublicacao;
}

export interface PublicacaoDiff {
  publicacaoId: string;
  versao: string;
  comparadaComId: string;
  versaoComparada: string;
  totaisPorMudanca: Partial<Record<MudancaPublicacao, number>>;
  itens: PublicacaoDiffItem[];
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
