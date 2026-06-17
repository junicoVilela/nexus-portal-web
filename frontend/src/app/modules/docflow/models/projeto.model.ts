export interface Projeto {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
