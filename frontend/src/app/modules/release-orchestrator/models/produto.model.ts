export interface Produto {
  id: string;
  nome: string;
  sigla: string;
  descricao?: string;
  cor: string;
  icone?: string;
  logoUrl?: string;
  responsavelId?: string;
  responsavel?: string;
  ativo: boolean;
  totalReleases?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProdutoForm {
  nome: string;
  sigla: string;
  descricao?: string;
  cor: string;
  responsavelId?: string;
  ativo: boolean;
}
