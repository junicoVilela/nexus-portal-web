export interface Dominio {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
}

export interface DominioForm {
  nome: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
}
