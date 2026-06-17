export type AcaoPermissao = 'LER' | 'CRIAR' | 'EDITAR' | 'EXCLUIR' | 'EXECUTAR' | string;

export interface Permissao {
  id: string;
  funcionalidadeId: string;
  funcionalidadeCodigo?: string;
  dominioCodigo?: string;
  acao: AcaoPermissao;
  /** Código no padrão `DOMINIO:ACAO`. */
  codigo: string;
  descricao: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
}

export interface PermissaoForm {
  funcionalidadeId: string;
  acao: AcaoPermissao;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}
