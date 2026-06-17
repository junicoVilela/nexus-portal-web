export interface Funcionalidade {
  id: string;
  dominioId: string;
  dominioCodigo?: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
}

export interface FuncionalidadeForm {
  dominioId: string;
  nome: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}
