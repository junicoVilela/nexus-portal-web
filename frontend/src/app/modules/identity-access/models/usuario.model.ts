export interface Usuario {
  id: string;
  nome: string;
  email: string;
  login: string;
  ativo: boolean;
  bloqueado: boolean;
  tentativasInvalidas: number;
  trocarSenhaProximoLogin: boolean;
  ultimoLogin: string | null;
  criadoEm: string;
  atualizadoEm: string | null;
  /** IDs dos grupos vinculados (não persistido no model raiz, derivado). */
  grupoIds?: string[];
}

export interface UsuarioForm {
  nome: string;
  email: string;
  login: string;
  senha?: string;
  ativo: boolean;
  grupoIds: string[];
}
