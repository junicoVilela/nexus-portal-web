export type AcessoTemporarioStatus = 'AGENDADO' | 'ATIVO' | 'EXPIRADO' | 'REVOGADO';

export interface AcessoTemporario {
  id: string;
  usuarioId: string;
  /** Pelo menos um de grupoAcessoId ou permissaoId deve ser informado. */
  grupoAcessoId: string | null;
  permissaoId: string | null;
  escopoAcessoId: string | null;
  inicioEm: string;
  fimEm: string;
  status: AcessoTemporarioStatus;
  justificativa: string | null;
  criadoEm: string;
  revogadoEm: string | null;
}

export interface AcessoTemporarioForm {
  usuarioId: string;
  grupoAcessoId?: string;
  permissaoId?: string;
  escopoAcessoId?: string;
  /** ISO datetime. */
  inicioEm: string;
  /** ISO datetime. */
  fimEm: string;
  justificativa?: string;
}
