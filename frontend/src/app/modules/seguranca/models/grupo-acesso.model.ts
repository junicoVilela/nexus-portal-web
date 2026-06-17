export interface GrupoAcesso {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
  /** IDs de permissões vinculadas (derivado). */
  permissaoIds?: string[];
  /** Total de usuários vinculados (calculado). */
  totalUsuarios?: number;
}

export interface GrupoAcessoForm {
  nome: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}
