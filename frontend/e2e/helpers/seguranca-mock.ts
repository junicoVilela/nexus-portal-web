import { Page } from '@playwright/test';

const TODAS_PERMISSOES = [
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
  'USUARIO:LER',
  'USUARIO:CRIAR',
  'USUARIO:EDITAR',
  'USUARIO:EXCLUIR',
  'GRUPO:LER',
  'GRUPO:CRIAR',
  'GRUPO:EDITAR',
  'GRUPO:EXCLUIR',
  'AUDITORIA:LER',
];

const DASHBOARD_RESUMO = {
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

function resultadoPaginado<T>(items: T[]) {
  return {
    items,
    page: 1,
    size: 20,
    totalItems: items.length,
    totalPages: items.length ? 1 : 0,
    first: true,
    last: true,
  };
}

const USUARIO_ADMIN = {
  id: 'usuario-admin',
  username: 'admin',
  nome: 'Administrador E2E',
  email: 'admin@softon.test',
  ativo: true,
  bloqueado: false,
  tentativasInvalidas: 0,
  trocarSenhaProximoLogin: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  createdBy: 'system',
  updatedBy: null,
};

const GRUPO_ADMIN = {
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

/** Instala mocks de auth/RBAC e rotas mínimas do Doc Flow para E2E do módulo Segurança. */
export async function instalarMocksSeguranca(page: Page): Promise<void> {
  const payloadToken = Buffer.from(JSON.stringify({ sub: 'admin', exp: 4_102_444_800 })).toString('base64url');
  const token = `e30.${payloadToken}.assinatura-e2e`;

  await page.context().route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const responder = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (method === 'POST' && path === '/api/v1/auth/login') {
      return responder({ token, username: 'admin' });
    }

    if (method === 'GET' && path === '/api/v1/auth/me') {
      return responder({
        id: USUARIO_ADMIN.id,
        username: USUARIO_ADMIN.username,
        nome: USUARIO_ADMIN.nome,
        email: USUARIO_ADMIN.email,
        grupos: [{ id: GRUPO_ADMIN.id, codigo: GRUPO_ADMIN.codigo, nome: GRUPO_ADMIN.nome }],
        permissoes: TODAS_PERMISSOES,
      });
    }

    if (method === 'GET' && path === '/api/v1/rbac/usuarios') {
      return responder(resultadoPaginado([USUARIO_ADMIN]));
    }

    if (method === 'GET' && path === `/api/v1/rbac/usuarios/${USUARIO_ADMIN.id}`) {
      return responder(USUARIO_ADMIN);
    }

    if (method === 'GET' && path === `/api/v1/rbac/usuarios/${USUARIO_ADMIN.id}/grupos`) {
      return responder([GRUPO_ADMIN.id]);
    }

    if (method === 'GET' && path === '/api/v1/rbac/grupos') {
      return responder(resultadoPaginado([GRUPO_ADMIN]));
    }

    if (method === 'GET' && path === '/api/v1/rbac/catalogo/permissoes') {
      return responder(
        TODAS_PERMISSOES.map((codigo, index) => ({
          id: `perm-${index}`,
          funcionalidadeId: `func-${index}`,
          funcionalidadeCodigo: codigo.split(':')[0],
          dominioCodigo: 'DOCFLOW',
          acao: codigo.split(':')[1],
          codigo,
          descricao: codigo,
          ativo: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: null,
        })),
      );
    }

    if (method === 'GET' && path === '/api/v1/rbac/auditoria') {
      return responder(
        resultadoPaginado([
          {
            id: 'aud-1',
            entidade: 'USUARIO',
            entidadeId: USUARIO_ADMIN.id,
            acao: 'LOGIN',
            descricao: 'Login E2E',
            createdAt: '2026-01-01T00:00:00Z',
            createdBy: USUARIO_ADMIN.username,
          },
        ]),
      );
    }

    if (method === 'GET' && path === '/api/doc-flow/dashboard/resumo') {
      return responder(DASHBOARD_RESUMO);
    }

    if (method === 'GET' && path === '/api/v1/docflow/empresa/logo') {
      return route.fulfill({ status: 404, body: '' });
    }

    if (method === 'GET' && path.startsWith('/api/v1/docflow/')) {
      return responder(resultadoPaginado([]));
    }

    if (method === 'GET' && path.startsWith('/api/v1/release-orchestrator/')) {
      return responder(resultadoPaginado([]));
    }

    return responder({ message: `Mock segurança não configurado para ${method} ${path}` }, 501);
  });
}
