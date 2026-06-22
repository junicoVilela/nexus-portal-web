import { OrigemFuncionalidade } from './cliente.model';

export interface DominioProduto {
  id: string;
  produtoId: string;
  nome: string;
  codigo: string;
  codigoLegado?: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

export interface FuncionalidadeProduto {
  id: string;
  dominioProdutoId: string;
  nome: string;
  codigo: string;
  codigoLegado?: string;
  codigoOperacao?: string;
  descricao?: string;
  critica: boolean;
  ordem: number;
  ativo: boolean;
}

export interface ClienteFuncionalidade {
  id: string;
  clienteId: string;
  funcionalidadeProdutoId: string;
  funcionalidadeCodigo: string;
  funcionalidadeNome: string;
  dominioProdutoId: string;
  dominioCodigo: string;
  dominioNome: string;
  produtoId: string;
  habilitada: boolean;
  origem: OrigemFuncionalidade;
  updatedAt?: string;
}

export interface SalvarClienteFuncionalidadeForm {
  habilitada: boolean;
  origem?: OrigemFuncionalidade;
}

export const ORIGEM_FUNCIONALIDADE_LABELS: Record<OrigemFuncionalidade, string> = {
  MANUAL: 'Manual',
  TEMPLATE: 'Template',
  HERDADA: 'Herdada',
};
