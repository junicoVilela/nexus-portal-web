import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    size: 10,
    totalItems: items.length,
    totalPages: items.length ? 1 : 0,
    first: true,
    last: true,
  };
}

/** Instala JWT mock e rotas mínimas para rotas autenticadas do Doc Flow em E2E a11y. */
export async function instalarMocksDocFlowA11y(
  page: Page,
  permissoes: string[] = TODAS_PERMISSOES,
): Promise<void> {
  const payloadToken = Buffer.from(JSON.stringify({ sub: 'admin', exp: 4_102_444_800 })).toString('base64url');
  await page.addInitScript(
    ({ token }) => {
      localStorage.clear();
      localStorage.setItem('doc-flow-jwt', token);
      localStorage.setItem('doc-flow-username', 'admin');
    },
    { token: `e30.${payloadToken}.assinatura-e2e` },
  );

  await page.context().route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const responder = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (method === 'GET' && path === '/api/v1/auth/me') {
      return responder({
        id: 'usuario-admin',
        username: 'admin',
        nome: 'Administrador E2E',
        email: 'admin@softon.test',
        grupos: [{ id: 'grupo-admin', codigo: 'ADMIN', nome: 'Administradores' }],
        permissoes,
      });
    }

    if (method === 'GET' && path === '/api/doc-flow/dashboard/resumo') {
      return responder(DASHBOARD_RESUMO);
    }

    if (method === 'GET' && path === '/api/doc-flow/publicacoes') {
      return responder(resultadoPaginado([]));
    }

    if (method === 'GET' && path === '/api/doc-flow/paginas/anexos') {
      return responder(resultadoPaginado([]));
    }

    if (method === 'GET' && path === '/api/doc-flow/paginas') {
      return responder(resultadoPaginado([]));
    }

    if (method === 'GET' && path === '/api/doc-flow/paginas/resumo-por-status') {
      return responder({});
    }

    if (method === 'GET' && path === '/api/doc-flow/projetos') {
      return responder(resultadoPaginado([]));
    }

    if (method === 'GET' && path === '/api/doc-flow/modulos') {
      return responder(resultadoPaginado([]));
    }

    return responder({ message: `Mock a11y não configurado para ${method} ${path}` }, 501);
  });
}

export async function analisarA11y(page: Page, selector?: string) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  if (selector) {
    builder = builder.include(selector);
  }
  const results = await builder.analyze();
  if (results.violations.length > 0) {
    // eslint-disable-next-line no-console
    console.log('A11y violations:', JSON.stringify(results.violations, null, 2));
  }
  expect(results.violations).toEqual([]);
}
