import { AmbientePadrao } from './cliente.model';
import { TipoModulo } from './entrega-modulo.model';

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

export interface ClienteProdutoModulo {
  id: string;
  clienteProdutoId: string;
  moduloProdutoId: string;
  moduloCodigo: string;
  moduloNome: string;
  moduloTipo: TipoModulo;
  versaoAtual?: string;
  ativo: boolean;
  updatedAt?: string;
}

export interface SalvarClienteProdutoModuloForm {
  versaoAtual?: string | null;
  ativo?: boolean;
}
