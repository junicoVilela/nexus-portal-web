export interface HistoricoLogin {
  id: string;
  usuarioId: string | null;
  loginInformado: string;
  ipOrigem: string | null;
  userAgent: string | null;
  sucesso: boolean;
  motivoFalha: string | null;
  criadoEm: string;
}
