export interface Modulo {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  projetoId: string;
  projetoNome: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
