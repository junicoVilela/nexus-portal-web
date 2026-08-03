/** Fixtures e helpers compartilhados para mocks E2E de Doc Flow e Segurança. */

export const TODAS_PERMISSOES_DOCFLOW = [
  'CLIENTE:LER',
  'CLIENTE:CRIAR',
  'CLIENTE:EDITAR',
  'CLIENTE:EXCLUIR',
  'PROJETO:LER',
  'PROJETO:CRIAR',
  'PROJETO:EDITAR',
  'PROJETO:EXCLUIR',
  'MODULO:LER',
  'MODULO:CRIAR',
  'MODULO:EDITAR',
  'MODULO:EXCLUIR',
  'PAGINA:LER',
  'PAGINA:CRIAR',
  'PAGINA:EDITAR',
  'PAGINA:EXCLUIR',
  'PUBLICACAO:LER',
  'PUBLICACAO:CRIAR',
  'PUBLICACAO:EXCLUIR',
  'AJUDA:LER',
  'AJUDA:CRIAR',
  'AJUDA:EDITAR',
  'AJUDA:EXCLUIR',
] as const;

export const TODAS_PERMISSOES_RELEASE_ORCHESTRATOR = [
  'RELEASE:LER',
  'RELEASE:CRIAR',
  'PROXIMA_ENTREGA:LER',
  'ENTREGA:LER',
  'CLIENTE_RO:LER',
  'PRODUTO:LER',
  'TEMPLATE:LER',
] as const;

export const TODAS_PERMISSOES_SEGURANCA = [
  'USUARIO:LER',
  'USUARIO:CRIAR',
  'USUARIO:EDITAR',
  'USUARIO:EXCLUIR',
  'GRUPO_ACESSO:LER',
  'GRUPO_ACESSO:CRIAR',
  'GRUPO_ACESSO:EDITAR',
  'GRUPO_ACESSO:VINCULAR_PERMISSAO',
  'DOMINIO:LER',
  'ESCOPO:LER',
  'HISTORICO_LOGIN:VISUALIZAR',
  'AUDITORIA:VISUALIZAR',
  'POLITICA_SENHA:EDITAR',
  'SESSAO:LER',
  'ACESSO_TEMPORARIO:LER',
  'AUDITORIA:LER',
  'GRUPO:LER',
  'GRUPO:CRIAR',
  'GRUPO:EDITAR',
  'GRUPO:EXCLUIR',
] as const;

/** Permissões de admin E2E (Doc Flow + Segurança + Release Orchestrator). */
export const TODAS_PERMISSOES: string[] = [
  ...new Set([
    ...TODAS_PERMISSOES_DOCFLOW,
    ...TODAS_PERMISSOES_SEGURANCA,
    ...TODAS_PERMISSOES_RELEASE_ORCHESTRATOR,
  ]),
];

export const DASHBOARD_RESUMO = {
  totalClientes: 1,
  totalProjetos: 1,
  totalModulos: 1,
  totalPaginas: 2,
  totalPublicacoes: 0,
  paginasPendentes: 1,
  paginasEmRevisao: 0,
  publicacoesGerando: 0,
  publicacoesComErro: 0,
  clientesSemPublicacao: 0,
  paginasSemResumo: 0,
  paginasDesatualizadas: 0,
  taxaSucessoPublicacoes: 100,
  paginasPorStatus: { RASCUNHO: 2 },
};

export const USUARIO_ADMIN = {
  id: 'usuario-admin',
  username: 'admin',
  nome: 'Administrador E2E',
  email: 'admin@nexus.test',
  ativo: true,
  bloqueado: false,
  tentativasInvalidas: 0,
  trocarSenhaProximoLogin: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  createdBy: 'system',
  updatedBy: null,
};

export const GRUPO_ADMIN = {
  id: 'grupo-admin',
  codigo: 'ADMIN',
  nome: 'Administradores',
  descricao: 'Grupo administrativo E2E',
  ativo: true,
  permissoes: TODAS_PERMISSOES,
  totalUsuarios: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  createdBy: 'system',
  updatedBy: null,
};

export const CATALOGO_DOMINIOS = [
  {
    id: 'dom-docflow',
    codigo: 'DOCFLOW',
    nome: 'Doc Flow',
    descricao: 'Documentação operacional',
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'dom-seguranca',
    codigo: 'SEGURANCA',
    nome: 'Segurança',
    descricao: 'RBAC e governança',
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
  },
];

export const CATALOGO_FUNCIONALIDADES = [
  {
    id: 'func-cliente',
    dominioId: 'dom-docflow',
    dominioCodigo: 'DOCFLOW',
    codigo: 'CLIENTE',
    nome: 'Cliente',
    descricao: null,
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'func-usuario',
    dominioId: 'dom-seguranca',
    dominioCodigo: 'SEGURANCA',
    codigo: 'USUARIO',
    nome: 'Usuário',
    descricao: null,
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
  },
];

export const CATALOGO_PERMISSOES = [
  {
    id: 'perm-cliente-ler',
    funcionalidadeId: 'func-cliente',
    funcionalidadeCodigo: 'CLIENTE',
    dominioCodigo: 'DOCFLOW',
    acao: 'LER',
    codigo: 'CLIENTE:LER',
    descricao: 'CLIENTE:LER',
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'perm-usuario-ler',
    funcionalidadeId: 'func-usuario',
    funcionalidadeCodigo: 'USUARIO',
    dominioCodigo: 'SEGURANCA',
    acao: 'LER',
    codigo: 'USUARIO:LER',
    descricao: 'USUARIO:LER',
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 'perm-dominio-ler',
    funcionalidadeId: 'func-dominio',
    funcionalidadeCodigo: 'DOMINIO',
    dominioCodigo: 'SEGURANCA',
    acao: 'LER',
    codigo: 'DOMINIO:LER',
    descricao: 'DOMINIO:LER',
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
  },
];

export const AUDITORIA_REGISTRO = {
  id: 'aud-1',
  entidade: 'USUARIO',
  entidadeId: USUARIO_ADMIN.id,
  acao: 'LOGIN',
  descricao: 'Login E2E',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: USUARIO_ADMIN.username,
};

export function resultadoPaginado<T>(
  items: T[],
  options: { page?: number; size?: number } = {},
) {
  const page = options.page ?? 1;
  const size = options.size ?? 20;
  return {
    items,
    page,
    size,
    totalItems: items.length,
    totalPages: items.length ? 1 : 0,
    first: true,
    last: true,
  };
}

export function authMePayload(permissoes: string[] = TODAS_PERMISSOES) {
  return {
    id: USUARIO_ADMIN.id,
    username: USUARIO_ADMIN.username,
    nome: USUARIO_ADMIN.nome,
    email: USUARIO_ADMIN.email,
    grupos: [{ id: GRUPO_ADMIN.id, codigo: GRUPO_ADMIN.codigo, nome: GRUPO_ADMIN.nome }],
    permissoes,
  };
}

export function e2eJwtToken(): string {
  const payloadToken = Buffer.from(JSON.stringify({ sub: 'admin', exp: 4_102_444_800 })).toString(
    'base64url',
  );
  return `e30.${payloadToken}.assinatura-e2e`;
}

export function isDocFlowApiPath(path: string): boolean {
  return path.startsWith('/api/doc-flow/') || path.startsWith('/api/v1/docflow/');
}

export function isRbacApiPath(path: string): boolean {
  return path.startsWith('/api/v1/rbac/');
}

export function isDashboardResumoPath(path: string): boolean {
  return path === '/api/doc-flow/dashboard/resumo' || path === '/api/v1/docflow/dashboard/resumo';
}

export function isEmpresaLogoPath(path: string): boolean {
  return path === '/api/v1/docflow/empresa/logo' || path === '/api/doc-flow/empresa/logo';
}

/** Normaliza sufixo Doc Flow para comparação entre prefixos legado e v1. */
export function docFlowResourcePath(path: string): string | null {
  if (path.startsWith('/api/doc-flow/')) return path.slice('/api/doc-flow'.length);
  if (path.startsWith('/api/v1/docflow/')) return path.slice('/api/v1/docflow'.length);
  return null;
}

export type MockResponder = (body: unknown, status?: number) => Promise<void>;

export interface MockRouteContext {
  path: string;
  method: string;
}

/** Rotas de auth compartilhadas (login + /me). */
export async function tryHandleAuthRoutes(
  ctx: MockRouteContext,
  responder: MockResponder,
  permissoes: string[] = TODAS_PERMISSOES,
): Promise<boolean> {
  const { path, method } = ctx;

  if (method === 'POST' && path === '/api/v1/auth/login') {
    await responder({ token: e2eJwtToken(), username: 'admin' });
    return true;
  }

  if (method === 'GET' && path === '/api/v1/auth/me') {
    await responder(authMePayload(permissoes));
    return true;
  }

  return false;
}

/** Rotas RBAC usadas pelas telas de Segurança. */
export async function tryHandleRbacRoutes(ctx: MockRouteContext, responder: MockResponder): Promise<boolean> {
  const { path, method } = ctx;
  if (!isRbacApiPath(path) || method !== 'GET') return false;

  if (path === '/api/v1/rbac/usuarios') {
    await responder(resultadoPaginado([USUARIO_ADMIN]));
    return true;
  }

  if (path === `/api/v1/rbac/usuarios/${USUARIO_ADMIN.id}`) {
    await responder(USUARIO_ADMIN);
    return true;
  }

  if (path === `/api/v1/rbac/usuarios/${USUARIO_ADMIN.id}/grupos`) {
    await responder([GRUPO_ADMIN.id]);
    return true;
  }

  if (path === '/api/v1/rbac/grupos') {
    await responder(resultadoPaginado([GRUPO_ADMIN]));
    return true;
  }

  if (path === `/api/v1/rbac/grupos/${GRUPO_ADMIN.id}`) {
    await responder(GRUPO_ADMIN);
    return true;
  }

  if (path === `/api/v1/rbac/grupos/${GRUPO_ADMIN.id}/usuarios`) {
    await responder([USUARIO_ADMIN.id]);
    return true;
  }

  if (path === `/api/v1/rbac/grupos/${GRUPO_ADMIN.id}/permissoes`) {
    await responder({ permissoes: TODAS_PERMISSOES });
    return true;
  }

  if (path === '/api/v1/rbac/catalogo/dominios') {
    await responder(CATALOGO_DOMINIOS);
    return true;
  }

  if (path === '/api/v1/rbac/catalogo/funcionalidades') {
    await responder(CATALOGO_FUNCIONALIDADES);
    return true;
  }

  if (path === '/api/v1/rbac/catalogo/permissoes') {
    await responder(CATALOGO_PERMISSOES);
    return true;
  }

  if (path === '/api/v1/rbac/auditoria') {
    await responder(resultadoPaginado([AUDITORIA_REGISTRO]));
    return true;
  }

  if (path === '/api/v1/rbac/politica-senha') {
    await responder({
      tamanhoMinimo: 8,
      exigirMaiuscula: true,
      exigirMinuscula: true,
      exigirNumero: true,
      exigirEspecial: false,
      expiracaoDias: 90,
      historicoSenhas: 3,
    });
    return true;
  }

  if (path === '/api/v1/rbac/escopos') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (path === '/api/v1/rbac/sessoes') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (path === '/api/v1/rbac/historico-login') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (path === '/api/v1/rbac/acessos-temporarios') {
    await responder(resultadoPaginado([]));
    return true;
  }

  return false;
}

/** Rotas Doc Flow mínimas para dashboard, listas e a11y. */
export async function tryHandleDocFlowRoutes(ctx: MockRouteContext, responder: MockResponder): Promise<boolean> {
  const { path, method } = ctx;
  if (method !== 'GET' || !isDocFlowApiPath(path)) return false;

  if (isDashboardResumoPath(path)) {
    await responder(DASHBOARD_RESUMO);
    return true;
  }

  if (isEmpresaLogoPath(path)) {
    await responder('', 404);
    return true;
  }

  const resource = docFlowResourcePath(path);
  if (!resource) return false;

  if (resource === '/publicacoes') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (resource === '/paginas/anexos') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (resource === '/paginas') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (resource === '/paginas/resumo-por-status') {
    await responder({});
    return true;
  }

  if (resource === '/projetos') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (resource === '/modulos') {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (resource === '/clientes') {
    await responder(resultadoPaginado([]));
    return true;
  }

  return false;
}

/** Fallback genérico para GETs Doc Flow / Release Orchestrator não mapeados explicitamente. */
export async function tryHandleDocFlowFallbackGet(
  ctx: MockRouteContext,
  responder: MockResponder,
): Promise<boolean> {
  const { path, method } = ctx;
  if (method !== 'GET') return false;

  if (isDocFlowApiPath(path)) {
    await responder(resultadoPaginado([]));
    return true;
  }

  if (path.startsWith('/api/v1/release-orchestrator/')) {
    await responder(resultadoPaginado([]));
    return true;
  }

  return false;
}
