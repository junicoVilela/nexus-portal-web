/** Resposta de POST /api/v1/auth/login (backend). */
export interface BackendLoginResponse {
  token: string;
  username: string;
}

/** Resposta de GET /api/v1/auth/me (backend). */
export interface BackendMeResponse {
  id: string;
  username: string;
  nome: string | null;
  email: string | null;
  grupos: { id: string; codigo: string; nome: string }[];
  permissoes: string[];
}

/** Resposta normalizada após login (camada front). */
export interface LoginResponse {
  token: string;
  refreshToken?: string;
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
