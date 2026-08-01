import AxeBuilder from '@axe-core/playwright';
import { expect, Page, Route, test } from '@playwright/test';
import {
  TODAS_PERMISSOES,
  authMePayload,
  e2eJwtToken,
  resultadoPaginado,
} from './helpers/docflow-api-fixtures';

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
    parentId?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  }>;
  ajuda: AjudaConteudoE2E[];
  ajudaEventos: Record<string, unknown>[];
}

interface AjudaConteudoE2E {
  id: string;
  codigo: string;
  tipo: 'JORNADA' | 'ETAPA' | 'FAQ' | 'ARTIGO' | 'TOUR_PASSO' | 'ONBOARDING';
  jornadaCodigo: string | null;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  rotaContexto: string | null;
  rotaAcao: string | null;
  rotuloAcao: string | null;
  icone: string | null;
  seletorAlvo: string | null;
  mediaTipo: 'NENHUMA' | 'IMAGEM' | 'GIF' | 'VIDEO' | 'GALERIA';
  mediaUrls: string[];
  mediaAlt: string | null;
  ordem: number;
  ativo: boolean;
}

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

const AJUDA_CONTEUDOS: AjudaConteudoE2E[] = [
  {
    id: 'ajuda-jornada',
    codigo: 'JORNADA_ESTRUTURA',
    tipo: 'JORNADA',
    jornadaCodigo: null,
    titulo: 'Preparar a estrutura',
    resumo: 'Cadastre a base que organiza o manual.',
    conteudo: 'Cliente, projeto e módulo formam a estrutura.',
    rotaContexto: '/doc-flow',
    rotaAcao: '/doc-flow/clientes/novo',
    rotuloAcao: 'Começar',
    icone: 'Layers',
    seletorAlvo: null,
    mediaTipo: 'IMAGEM',
    mediaUrls: ['data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='],
    mediaAlt: 'Fluxo de estrutura do manual',
    ordem: 10,
    ativo: true,
  },
  {
    id: 'ajuda-etapa',
    codigo: 'ESTRUTURA_CLIENTE',
    tipo: 'ETAPA',
    jornadaCodigo: 'JORNADA_ESTRUTURA',
    titulo: 'Cadastre o cliente',
    resumo: 'Defina quem receberá o manual.',
    conteudo: 'O cliente concentra os vínculos do manual.',
    rotaContexto: '/doc-flow/clientes',
    rotaAcao: '/doc-flow/clientes/novo',
    rotuloAcao: 'Novo cliente',
    icone: 'Building2',
    seletorAlvo: null,
    mediaTipo: 'NENHUMA',
    mediaUrls: [],
    mediaAlt: null,
    ordem: 11,
    ativo: true,
  },
  {
    id: 'ajuda-faq',
    codigo: 'FAQ_ORDEM',
    tipo: 'FAQ',
    jornadaCodigo: null,
    titulo: 'Qual é a ordem correta dos cadastros?',
    resumo: 'Cliente, projeto, módulo e página.',
    conteudo: null,
    rotaContexto: '/doc-flow',
    rotaAcao: null,
    rotuloAcao: null,
    icone: 'HelpCircle',
    seletorAlvo: null,
    mediaTipo: 'NENHUMA',
    mediaUrls: [],
    mediaAlt: null,
    ordem: 100,
    ativo: true,
  },
  {
    id: 'ajuda-tour-dashboard',
    codigo: 'TOUR_DASHBOARD',
    tipo: 'TOUR_PASSO',
    jornadaCodigo: null,
    titulo: 'Acompanhe o trabalho',
    resumo: 'O dashboard reúne os indicadores principais.',
    conteudo: null,
    rotaContexto: null,
    rotaAcao: '/doc-flow',
    rotuloAcao: 'Abrir dashboard',
    icone: 'BarChart2',
    seletorAlvo: '[data-help-id="dashboard"]',
    mediaTipo: 'NENHUMA',
    mediaUrls: [],
    mediaAlt: null,
    ordem: 200,
    ativo: true,
  },
];

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
  const estado: EstadoDocFlow = {
    clientes: [],
    projetos: [],
    modulos: [],
    paginas: [],
    ajuda: structuredClone(AJUDA_CONTEUDOS),
    ajudaEventos: [],
  };
  await page.addInitScript(
    ({ token }) => {
      localStorage.clear();
      localStorage.setItem('doc-flow-jwt', token);
      localStorage.setItem('doc-flow-username', 'admin');
    },
    { token: e2eJwtToken() },
  );

  await page.context().route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const responder = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (method === 'GET' && path === '/api/v1/auth/me') {
      return responder(authMePayload(permissoes));
    }

    if (method === 'GET' && path === '/api/doc-flow/dashboard/resumo') {
      return responder({
        totalClientes: estado.clientes.length,
        totalProjetos: estado.projetos.length,
        totalModulos: estado.modulos.length,
        totalPaginas: estado.paginas.length,
        totalPublicacoes: 0,
        paginasPendentes: estado.paginas.filter(p => p.status === 'EM_REVISAO').length,
        paginasEmRevisao: estado.paginas.filter(p => p.status === 'EM_REVISAO').length,
        publicacoesGerando: 0,
        publicacoesComErro: 0,
        clientesSemPublicacao: estado.clientes.length > 0 ? estado.clientes.length : 0,
        paginasSemResumo: 0,
        paginasDesatualizadas: 0,
        taxaSucessoPublicacoes: 100,
        paginasPorStatus: estado.paginas.reduce<Record<string, number>>((acc, pagina) => {
          acc[pagina.status] = (acc[pagina.status] ?? 0) + 1;
          return acc;
        }, {}),
      });
    }

    if (method === 'GET' && path === '/api/doc-flow/publicacoes') {
      return responder(resultadoPaginado([], { size: 1000 }));
    }

    if (method === 'GET' && path === '/api/doc-flow/paginas/anexos') {
      return responder(resultadoPaginado([], { size: 1000 }));
    }

    if (method === 'GET' && path === '/api/doc-flow/ajuda/conteudos') {
      return responder(estado.ajuda.filter(item => item.ativo));
    }
    if (method === 'GET' && path === '/api/doc-flow/ajuda/conteudos/admin') {
      return responder(estado.ajuda);
    }
    if (method === 'GET' && path === '/api/doc-flow/ajuda/metricas') {
      return responder({
        desde: AGORA,
        totalEventos: estado.ajudaEventos.length,
        buscas: 2,
        buscasSemResultado: 1,
        toursIniciados: 1,
        toursConcluidos: 1,
        taxaConclusaoTour: 100,
        conteudosMaisAcessados: [],
        buscasFrequentes: [],
      });
    }
    if (method === 'POST' && path === '/api/doc-flow/ajuda/eventos') {
      estado.ajudaEventos.push(await jsonDaRota(route));
      return route.fulfill({ status: 204 });
    }
    if (method === 'POST' && path === '/api/doc-flow/ajuda/conteudos') {
      const body = await jsonDaRota(route);
      const item = { id: `ajuda-${estado.ajuda.length + 1}`, ...body } as AjudaConteudoE2E;
      estado.ajuda.push(item);
      return responder(item, 201);
    }
    const ajudaItem = path.match(/^\/api\/doc-flow\/ajuda\/conteudos\/([^/]+)$/);
    if (method === 'PUT' && ajudaItem) {
      const body = await jsonDaRota(route);
      const index = estado.ajuda.findIndex(item => item.id === ajudaItem[1]);
      if (index < 0) return responder({ message: 'Conteúdo não encontrado' }, 404);
      estado.ajuda[index] = { ...estado.ajuda[index], ...body } as AjudaConteudoE2E;
      return responder(estado.ajuda[index]);
    }
    if (method === 'DELETE' && ajudaItem) {
      estado.ajuda = estado.ajuda.filter(item => item.id !== ajudaItem[1]);
      return route.fulfill({ status: 204 });
    }

    if (path === '/api/doc-flow/clientes' && method === 'GET')
      return responder(resultadoPaginado(estado.clientes, { size: 1000 }));
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
      return responder(resultadoPaginado(estado.projetos, { size: 1000 }));
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
      return responder(resultadoPaginado(items, { size: 1000 }));
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

    if (
      (path === '/api/doc-flow/paginas/templates' || path === '/api/v1/docflow/paginas/templates') &&
      method === 'GET'
    )
      return responder([TEMPLATE]);
    if (
      (path === `/api/doc-flow/paginas/templates/${TEMPLATE.id}/aplicar` ||
        path === `/api/v1/docflow/paginas/templates/${TEMPLATE.id}/aplicar`) &&
      method === 'POST'
    ) {
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
      return responder(resultadoPaginado(estado.paginas, { size: 1000 }));
    if (path === '/api/doc-flow/paginas' && method === 'POST') {
      const body = await jsonDaRota(route);
      const projeto = estado.projetos.find(item => item.id === body['projetoId']);
      const modulo = estado.modulos.find(item => item.id === body['moduloId']);
      const pagina = {
        id: `pagina-${estado.paginas.length + 1}`,
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
        parentId: body['parentId'] ? String(body['parentId']) : undefined,
        createdAt: AGORA,
        updatedAt: AGORA,
        createdBy: 'admin',
        updatedBy: 'admin',
      };
      estado.paginas.push(pagina);
      return responder(pagina, 201);
    }

    const paginaDetalhe = path.match(/^\/api\/doc-flow\/paginas\/([^/]+)$/);
    if (method === 'GET' && paginaDetalhe && !paginaDetalhe[1].includes('/')) {
      const pagina = estado.paginas.find(item => item.id === paginaDetalhe[1]);
      if (!pagina) return responder({ message: 'Página não encontrada' }, 404);
      return responder(pagina);
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
        parentId:
          body['parentId'] !== undefined
            ? body['parentId']
              ? String(body['parentId'])
              : undefined
            : pagina.parentId,
        version: pagina.version + 1,
        updatedAt: AGORA,
      });
      return responder(pagina);
    }

    if (method === 'GET' && /^\/api\/doc-flow\/paginas\/[^/]+\/revisoes$/.test(path)) {
      return responder(resultadoPaginado([], { size: 1000 }));
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
  test('dashboard prioriza quatro indicadores e resume a estrutura', async ({ page }) => {
    await instalarApiDocFlow(page);
    await page.goto('/doc-flow');

    await expect(page.getByRole('heading', { name: 'Visão operacional' })).toBeVisible();
    await expect(page.locator('.df-dash__stats ui-kpi-card')).toHaveCount(4);
    await expect(page.locator('.df-dash__structure-metric')).toHaveCount(3);
    await expect(page.locator('.df-dash__structure')).toContainText('Clientes');
    await expect(page.locator('.df-dash__structure')).toContainText('Projetos');
    await expect(page.locator('.df-dash__structure')).toContainText('Módulos');
    await expect(page.locator('.df-dash__kpi-link').first()).toHaveAttribute('href', '/doc-flow/paginas');

    const acessibilidade = await new AxeBuilder({ page })
      .include('.df-dash')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);
  });

  test('biblioteca de mídia atende WCAG A/AA', async ({ page }) => {
    await instalarApiDocFlow(page);
    await page.goto('/doc-flow/midias');
    await page.waitForSelector('.media-filters');

    const acessibilidade = await new AxeBuilder({ page })
      .include('ui-list-page')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);
  });

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
    await expect(page.locator('.creation-progress__steps button')).toHaveCount(4);
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
    await expect(page.getByRole('button', { name: /Contexto/ })).toHaveAttribute('aria-current', 'step');
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

  test('persiste parentId ao criar subpágina e ordena hierarquia na lista', async ({ page }) => {
    const estado = await instalarApiDocFlow(page);

    await page.goto('/doc-flow/projetos/novo');
    await page.locator('input[formcontrolname="nome"]').fill('Portal Hierarquia');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await page.goto('/doc-flow/modulos/novo');
    await page.locator('input[formcontrolname="nome"]').fill('Operações');
    await page.locator('select[formcontrolname="projetoId"]').selectOption('projeto-1');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await page.goto('/doc-flow/paginas/novo?projetoId=projeto-1&moduloId=modulo-1');
    await page.locator('input[formcontrolname="titulo"]').fill('Operações');
    await page.locator('input[formcontrolname="codigoTela"]').fill('OPS-001');
    await page.getByRole('button', { name: 'Salvar e voltar' }).click();
    await expect(page).toHaveURL(/\/doc-flow\/paginas(?:\?.*)?$/);

    await page.goto('/doc-flow/paginas/novo?projetoId=projeto-1&moduloId=modulo-1&parentId=pagina-1');
    await page.locator('input[formcontrolname="titulo"]').fill('Lista de fornecedores');
    await page.locator('input[formcontrolname="codigoTela"]').fill('OPS-LISTA');
    await page.getByRole('button', { name: 'Salvar e voltar' }).click();

    const filho = estado.paginas.find(item => item.titulo === 'Lista de fornecedores');
    expect(filho?.parentId).toBe('pagina-1');

    await page.goto('/doc-flow/paginas?moduloId=modulo-1');
    const linhas = page.locator('tr').filter({ hasText: 'Operações' }).or(page.locator('tr').filter({ hasText: 'Lista de fornecedores' }));
    await expect(linhas).toHaveCount(2);
    await expect(page.locator('tr').filter({ hasText: 'Lista de fornecedores' })).toContainText('--');
  });

  test('bloqueia rota de criação e oculta ações sem permissão', async ({ page }) => {
    await instalarApiDocFlow(page, ['PAGINA:LER']);

    await page.goto('/doc-flow/paginas/novo');
    await expect(page).toHaveURL(/\/seguranca\/acesso-negado$/);

    await page.goto('/doc-flow/paginas');
    await expect(page.getByRole('button', { name: 'Nova página' })).toHaveCount(0);
    await expect(page.locator('.paginas__drop-root')).toHaveCount(0);
  });

  test('central de ajuda oferece pesquisa, mídia, onboarding e tour acessíveis', async ({ page }) => {
    const estado = await instalarApiDocFlow(page);
    await page.goto('/doc-flow/ajuda');

    await expect(page.getByRole('heading', { name: 'Central de ajuda' })).toBeVisible();
    await expect(page.locator('.help-media img')).toHaveAttribute('alt', 'Fluxo de estrutura do manual');
    await page.getByRole('searchbox', { name: 'Pesquisar jornadas e etapas' }).fill('cliente');
    await expect(page.getByRole('heading', { name: 'Preparar a estrutura' })).toBeVisible();

    const acessibilidade = await new AxeBuilder({ page })
      .include('.help-page')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);

    const acionador = page.getByRole('button', { name: 'Abrir ajuda desta tela' });
    await acionador.click();
    const painel = page.getByRole('dialog', { name: 'Como podemos ajudar?' });
    await expect(painel).toBeFocused();
    await painel.getByRole('tab', { name: /Primeiros passos/ }).click();
    await painel.locator('.onboarding-list li').first().getByRole('button').click();
    await expect(painel.getByRole('tab', { name: /Primeiros passos/ })).toContainText('17%');
    await page.keyboard.press('Escape');
    await expect(painel).toBeHidden();
    await expect(acionador).toBeFocused();

    await acionador.click();
    await page.getByRole('button', { name: 'Fazer tour pelo Doc Flow' }).click();
    const tour = page.locator('.tour-card');
    await expect(tour).toBeFocused();
    await expect(tour).toContainText('Acompanhe o trabalho');
    await page.keyboard.press('Escape');
    await expect(tour).toBeHidden();
    expect(estado.ajudaEventos.some(item => item['tipo'] === 'TOUR_INICIADO')).toBe(true);
  });

  test('administra o catálogo de ajuda e protege a gestão por permissão', async ({ page }) => {
    const estado = await instalarApiDocFlow(page);
    await page.goto('/doc-flow/ajuda/gerenciar');

    await expect(page.getByRole('heading', { name: 'Gestão da ajuda' })).toBeVisible();
    await expect(page.getByLabel('Métricas dos últimos 30 dias')).toContainText('100%');
    await page.getByRole('button', { name: 'Novo conteúdo' }).click();
    await page.locator('input[formcontrolname="codigo"]').fill('ARTIGO_E2E');
    await page.locator('input[formcontrolname="titulo"]').fill('Artigo criado no teste');
    await page.locator('textarea[formcontrolname="resumo"]').fill('Orientação de validação E2E.');
    await page.getByRole('button', { name: 'Salvar conteúdo' }).click();
    await expect(page.getByRole('cell', { name: /Artigo criado no teste/ })).toBeVisible();
    expect(estado.ajuda.some(item => item.codigo === 'ARTIGO_E2E')).toBe(true);

    const paginaSemPermissao = await page.context().newPage();
    await instalarApiDocFlow(paginaSemPermissao, ['AJUDA:LER']);
    await paginaSemPermissao.goto('/doc-flow/ajuda/gerenciar');
    await expect(paginaSemPermissao).toHaveURL(/\/seguranca\/acesso-negado$/);
    await paginaSemPermissao.close();
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

  test('shell autenticado e lista atendem WCAG A/AA', async ({ page }) => {
    await instalarApiDocFlow(page);
    await page.goto('/doc-flow/paginas');
    await expect(page.locator('.shell__topbar')).toBeVisible();

    const acessibilidade = await new AxeBuilder({ page })
      .include('.shell')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(acessibilidade.violations).toEqual([]);
  });

  test('shell, menu do módulo e tabela não vazam a viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await instalarApiDocFlow(page);
    await page.goto('/doc-flow/paginas');

    await expect(page.locator('.df-shell__nav')).toBeVisible();
    const layout = await page.evaluate(() => {
      const nav = document.querySelector<HTMLElement>('.df-shell__nav');
      return {
        viewport: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        navOverflow: nav ? getComputedStyle(nav).overflowX : '',
        offenders: Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .filter(element => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .slice(0, 8)
          .map(element => `${element.tagName.toLowerCase()}.${element.className}`),
      };
    });

    expect(
      layout.documentWidth,
      `Elementos fora da viewport: ${layout.offenders.join(', ')}`,
    ).toBeLessThanOrEqual(layout.viewport);
    expect(layout.navOverflow).toBe('auto');
  });
});
