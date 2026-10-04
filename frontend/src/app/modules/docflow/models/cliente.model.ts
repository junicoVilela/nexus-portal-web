export interface Cliente {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  logoDisponivel?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PreviewToken {
  id: string;
  clienteId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  createdBy?: string;
}
