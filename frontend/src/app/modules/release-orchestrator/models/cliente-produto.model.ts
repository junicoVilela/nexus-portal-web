import { AmbientePadrao } from './cliente.model';

export interface ClienteProduto {
  id: string;
  clienteId: string;
  produtoId: string;
  produtoSigla: string;
  produtoNome: string;
  ambiente: AmbientePadrao;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContratarProdutoForm {
  produtoId: string;
  ambiente: AmbientePadrao;
}

export interface AtualizarClienteProdutoForm {
  ambiente: AmbientePadrao;
  ativo?: boolean;
}
