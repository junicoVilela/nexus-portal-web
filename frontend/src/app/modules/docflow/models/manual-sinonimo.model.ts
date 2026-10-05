/** Grupo de termos equivalentes na busca do manual de um cliente ("NF" = "nota fiscal"). */
export interface ManualSinonimo {
  id: string;
  clienteId: string;
  /** Como foram digitados; a busca compara sem acento e sem caixa. */
  termos: string[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}

export interface ManualSinonimoPayload {
  termos: string[];
}
