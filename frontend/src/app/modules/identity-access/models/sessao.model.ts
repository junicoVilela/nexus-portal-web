export interface SessaoUsuario {
  id: string;
  usuarioId: string;
  ipOrigem: string | null;
  userAgent: string | null;
  ativa: boolean;
  revogada: boolean;
  iniciadaEm: string;
  encerradaEm: string | null;
  /** Texto opcional explicando o motivo do encerramento (logout, revogada por X, etc.). */
  motivoEncerramento: string | null;
}
