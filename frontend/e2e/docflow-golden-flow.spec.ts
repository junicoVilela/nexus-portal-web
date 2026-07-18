import AxeBuilder from '@axe-core/playwright';
import { expect, Page, Route, test } from '@playwright/test';

type StatusPagina = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'PUBLICADO';

interface RegistroBase {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface EstadoDocFlow {
  clientes: RegistroBase[];
  projetos: (RegistroBase & { descricao: string })[];
  modulos: (RegistroBase & {
    descricao: string;
    ordem: number;
    projetoId: string;
    projetoNome: string;
  })[];
  paginas: Array<{
    id: string;
    version: number;
    titulo: string;
    slug: string;
    codigoTela: string;
    resumo: string;
    conteudoHtml: string;
    status: StatusPagina;
    ordem: number;
    ativo: boolean;
    moduloId: string;
    moduloNome: string;
    projetoId: string;
    projetoNome: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  }>;
}

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
];

const AGORA = '2026-07-18T15:00:00Z';
const TEMPLATE = {
  id: 'template-guia',
  codigo: 'GUIA_OPERACIONAL',
  nome: 'Guia operacional elegante',
  descricao: 'Objetivo, contexto e passo a passo para uma tela do sistema.',
  conteudoHtml: '<section><h2>{{titulo}}</h2><p>{{projeto.nome}} / {{modulo.nome}}</p></section>',
  ordem: 1,
  ativo: true,
  personalizado: false,
  versaoAtual: 2,
  paginasOriginadas: 4,
};

function resultadoPaginado<T>(items: T[]) {
  return { items, totalItems: items.length, totalPages: items.length ? 1 : 0, page: 1, size: 1000 };
}

function slug(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function jsonDaRota(route: Route): Promise<Record<string, unknown>> {
  return (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
}

async function instalarApiDocFlow(
  page: Page,
  permissoes: string[] = TODAS_PERMISSOES,
): Promise<EstadoDocFlow> {
  const estado: EstadoDocFlow = { clientes: [], projetos: [], modulos: [], paginas: [] };
  const payloadToken = Buffer.from(JSON.stringify({ sub: 'admin', exp: 4_102_444_800 })).toString(
    'base64url',
  );
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

    if (path === '/api/doc-flow/clientes' && method === 'GET')
      return responder(resultadoPaginado(estado.clientes));
    if (path === '/api/doc-flow/clientes' && method === 'POST') {
      const body = await jsonDaRota(route);
      const cliente: RegistroBase = {
        id: 'cliente-1',
        nome: String(body['nome']),
        slug: String(body['slug'] || slug(String(body['nome']))),
        ativo: body['ativo'] !== false,
        createdAt: AGORA,
        updatedAt: AGORA,
        createdBy: 'admin',
        updatedBy: 'admin',
      };
      estado.clientes = [cliente];
      return responder(cliente, 201);
    }

    if (path === '/api/doc-flow/projetos' && method === 'GET')
      return responder(resultadoPaginado(estado.projetos));
    if (path === '/api/doc-flow/projetos' && method === 'POST') {
      const body = await jsonDaRota(route);
      const projeto = {
        id: 'projeto-1',
        nome: String(body['nome']),
        slug: String(body['slug'] || slug(String(body['nome']))),
        descricao: String(body['descricao'] || ''),
        ativo: body['ativo'] !== false,
        createdAt: AGORA,
        updatedAt: AGORA,
        createdBy: 'admin',
        updatedBy: 'admin',
      };
      estado.projetos = [projeto];
      return responder(projeto, 201);
    }

    if (path === '/api/doc-flow/modulos' && method === 'GET') {
      const projetoId = url.searchParams.get('projetoId');
      const items = projetoId ? estado.modulos.filter(item => item.projetoId === projetoId) : estado.modulos;
      return responder(resultadoPaginado(items));
    }
    if (path === '/api/doc-flow/modulos' && method === 'POST') {
      const body = await jsonDaRota(route);
      const projeto = estado.projetos.find(item => item.id === body['projetoId']);
      const modulo = {
        id: 'modulo-1',
        nome: String(body['nome']),
        slug: String(body['slug'] || slug(String(body['nome']))),
        descricao: String(body['descricao'] || ''),
        ordem: Number(body['ordem'] || 0),
        ativo: body['ativo'] !== false,
        projetoId: String(body['projetoId']),
        projetoNome: projeto?.nome ?? '',
        createdAt: AGORA,
        updatedAt: AGORA,
        createdBy: 'admin',
        updatedBy: 'admin',
      };
      estado.modulos = [modulo];
      return responder(modulo, 201);
    }

    if (path === '/api/doc-flow/paginas/templates' && method === 'GET') return responder([TEMPLATE]);
    if (path === `/api/doc-flow/paginas/templates/${TEMPLATE.id}/aplicar` && method === 'POST') {
      const body = await jsonDaRota(route);
      const projeto = estado.projetos.find(item => item.id === body['projetoId']);
      const modulo = estado.modulos.find(item => item.id === body['moduloId']);
      const titulo = String(body['titulo'] || 'Nova página');
      return responder({
        templateId: TEMPLATE.id,
        versao: 2,
        conteudoHtml: `<section class="objective-card"><h2>${titulo}</h2><p>Projeto ${projeto?.nome}; módulo ${modulo?.nome}.</p><ol><li>Acesse a tela.</li><li>Preencha os dados.</li><li>Salve a operação.</li></ol></section>`,
        variaveisResolvidas: {
          titulo,
          'projeto.nome': projeto?.nome ?? '',
          'modulo.nome': modulo?.nome ?? '',
        },
        variaveisPendentes: [],
      });
    }

    if (path === '/api/doc-flow/paginas/resumo-por-status' && method === 'GET') {
      return responder(
        estado.paginas.reduce<Record<string, number>>((acc, pagina) => {
          acc[pagina.status] = (acc[pagina.status] ?? 0) + 1;
          return acc;
        }, {}),
      );
    }
    if (path === '/api/doc-flow/paginas' && method === 'GET')
      return responder(resultadoPaginado(estado.paginas));
    if (path === '/api/doc-flow/paginas' && method === 'POST') {
      const body = await jsonDaRota(route);
      const projeto = estado.projetos.find(item => item.id === body['projetoId']);
      const modulo = estado.modulos.find(item => item.id === body['moduloId']);
      const pagina = {
        id: 'pagina-1',
        version: 1,
        titulo: String(body['titulo']),
        slug: String(body['slug'] || slug(String(body['titulo']))),
        codigoTela: String(body['codigoTela']),
        resumo: String(body['resumo'] || ''),
        conteudoHtml: String(body['conteudoHtml'] || ''),
        status: 'RASCUNHO' as const,
        ordem: Number(body['ordem'] || 0),
        ativo: body['ativo'] !== false,
        moduloId: String(body['moduloId']),
        moduloNome: modulo?.nome ?? '',
        projetoId: String(body['projetoId']),
        projetoNome: projeto?.nome ?? '',
        createdAt: AGORA,
        updatedAt: AGORA,
        createdBy: 'admin',
        updatedBy: 'admin',
      };
      estado.paginas = [pagina];
      return responder(pagina, 201);
    }

    const paginaPersistencia = path.match(/^\/api\/doc-flow\/paginas\/([^/]+)(?:\/autosave)?$/);
    if (method === 'PUT' && paginaPersistencia) {
      const pagina = estado.paginas.find(item => item.id === paginaPersistencia[1]);
      if (!pagina) return responder({ message: 'Página não encontrada' }, 404);
      const body = await jsonDaRota(route);
      Object.assign(pagina, {
        titulo: String(body['titulo'] ?? pagina.titulo),
        slug: String(body['slug'] || pagina.slug),
        codigoTela: String(body['codigoTela'] ?? pagina.codigoTela),
        resumo: String(body['resumo'] ?? pagina.resumo),
        conteudoHtml: String(body['conteudoHtml'] ?? pagina.conteudoHtml),
        ordem: Number(body['ordem'] ?? pagina.ordem),
        ativo: body['ativo'] !== false,
        version: pagina.version + 1,
        updatedAt: AGORA,
      });
      return responder(pagina);
    }

    if (method === 'GET' && /^\/api\/doc-flow\/paginas\/[^/]+\/revisoes$/.test(path)) {
      return responder(resultadoPaginado([]));
    }

    const transicao = path.match(/^\/api\/doc-flow\/paginas\/([^/]+)\/(enviar-revisao|aprovar|publicar)$/);
    if (method === 'POST' && transicao) {
      const pagina = estado.paginas.find(item => item.id === transicao[1]);
      if (!pagina) return responder({ message: 'Página não encontrada' }, 404);
      const status: Record<string, StatusPagina> = {
        'enviar-revisao': 'EM_REVISAO',
        aprovar: 'APROVADO',
        publicar: 'PUBLICADO',
      };
      pagina.status = status[transicao[2]];
      pagina.version += 1;
      pagina.updatedAt = AGORA;
      return responder(pagina);
    }

    return responder({ message: `Mock E2E não configurado para ${method} ${path}` }, 501);
  });

  return estado;
}

test.describe('DocFlow — fluxo de ouro', () => {
  test('cria a estrutura, pré-visualiza o modelo e publica a página', async ({ page }) => {
    const estado = await instalarApiDocFlow(page);

    await page.goto('/doc-flow/clientes/novo');
    await page.locator('input[formcontrolname="nome"]').fill('Cliente Aurora');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page).toHaveURL(/\/doc-flow\/clientes$/);
    await expect.poll(() => estado.clientes[0]?.nome).toBe('Cliente Aurora');

    await page.goto('/doc-flow/projetos/novo');
    await page.locator('input[formcontrolname="nome"]').fill('Portal Aurora');
    await page.locator('textarea[formcontrolname="descricao"]').fill('Documentação do portal do cliente.');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page).toHaveURL(/\/doc-flow\/projetos$/);

    await page.goto('/doc-flow/modulos/novo');
    await page.locator('input[formcontrolname="nome"]').fill('Cadastros');
    await page.locator('select[formcontrolname="projetoId"]').selectOption('projeto-1');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page).toHaveURL(/\/doc-flow\/modulos$/);

    await page.goto('/doc-flow/paginas/novo?projetoId=projeto-1&moduloId=modulo-1');
    await expect(page.getByRole('heading', { name: 'Como você quer começar?' })).toBeVisible();
    await page.locator('input[formcontrolname="titulo"]').fill('Cadastrar fornecedor');
    await page.locator('input[formcontrolname="codigoTela"]').fill('CAD_FORNECEDOR');

    const card = page.locator('.template-card').filter({ hasText: TEMPLATE.nome });
    await card.getByRole('button', { name: /Visualizar modelo/ }).click();
    const preview = page.locator('.pf-template-preview');
    await expect(preview).toContainText('Cadastrar fornecedor');
    await expect(preview).toContainText('Portal Aurora');
    await expect(preview).toContainText('Cadastros');

    const acessibilidade = await new AxeBuilder({ page })
      .include('.pf-template-preview')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);

    await preview.getByRole('button', { name: 'Aplicar este modelo' }).click();
    await expect(page.locator('.pf-preview-body')).toContainText('Cadastrar fornecedor');
    await page.getByRole('button', { name: 'Salvar e voltar' }).click();
    await expect(page).toHaveURL(/\/doc-flow\/paginas(?:\?.*)?$/);

    const linha = page.locator('tr').filter({ hasText: 'Cadastrar fornecedor' });
    await expect(linha).toContainText('Rascunho');
    await linha.getByRole('button', { name: 'Revisão' }).click();
    await expect(linha).toContainText('Em revisão');
    await linha.getByRole('button', { name: 'Aprovar' }).click();
    await expect(linha).toContainText('Aprovado');
    await linha.getByRole('button', { name: 'Publicar' }).click();
    await expect(linha).toContainText('Publicado');
    expect(estado.paginas[0].status).toBe('PUBLICADO');
  });

  test('bloqueia rota de criação e oculta ações sem permissão', async ({ page }) => {
    await instalarApiDocFlow(page, ['PAGINA:LER']);

    await page.goto('/doc-flow/paginas/novo');
    await expect(page).toHaveURL(/\/seguranca\/acesso-negado$/);

    await page.goto('/doc-flow/paginas');
    await expect(page.getByRole('button', { name: 'Nova página' })).toHaveCount(0);
    await expect(page.locator('.paginas__drop-root')).toHaveCount(0);
  });

  test('catálogo de modelos usa uma coluna em viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await instalarApiDocFlow(page);
    await page.goto('/doc-flow/paginas/novo');

    const colunas = await page
      .locator('.template-picker__grid')
      .evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean));
    expect(colunas).toHaveLength(1);
  });
});
