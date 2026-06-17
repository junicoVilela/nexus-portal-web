/** Resposta de POST /api/auth/login (story 001). */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    login: string;
  };
}

/** Resposta de GET /api/auth/me (story 003). */
export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  login: string;
  grupos: { id: string; codigo: string; nome: string }[];
  /** Códigos de permissão (`DOMINIO:ACAO`). */
  permissoes: string[];
}
