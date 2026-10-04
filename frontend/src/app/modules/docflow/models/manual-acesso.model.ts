/** Chave de integração do manual de um cliente (Onda D). O valor só aparece na criação. */
export interface ManualAcesso {
  id: string;
  clienteId: string;
  nome: string;
  /** Começo do token, para reconhecer a chave sem expor o valor. */
  prefixo: string;
  origens: string[];
  ativo: boolean;
  expiraEm: string | null;
  ultimoUsoEm: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface ManualAcessoCriado {
  acesso: ManualAcesso;
  token: string;
}

export interface ManualAcessoPayload {
  nome: string;
  origens: string[];
  /** Vazio ou 0 = não expira. */
  diasValidade: number | null;
}
