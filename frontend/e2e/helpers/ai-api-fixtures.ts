import { Page } from '@playwright/test';
import {
  TODAS_PERMISSOES,
  authMePayload,
  e2eJwtToken,
  tryHandleAuthRoutes,
  tryHandleDocFlowFallbackGet,
  tryHandleDocFlowRoutes,
  tryHandleRbacRoutes,
} from './docflow-api-fixtures';

const AGORA = '2026-08-03T12:00:00Z';
const SESSAO_ID = '11111111-1111-1111-1111-111111111111';
const JOB_ID = '22222222-2222-2222-2222-222222222222';
const PROPOSTA_ID = '33333333-3333-3333-3333-333333333333';
const IMPORTACAO_ID = '44444444-4444-4444-4444-444444444444';
const PAGINA_PLANO_ID = '55555555-5555-5555-5555-555555555555';

const COMPONENTES_RECOMENDADOS = [
  componente('introducao', 'Introdução editorial', true, 'OBRIGATORIA'),
  componente('objetivo', 'Objetivo de negócio', false, 'RECOMENDADA'),
  componente('visao-tela', 'Visão da tela', true, 'OBRIGATORIA'),
  componente('filtros-resultado', 'Filtros → resultado', true, 'OBRIGATORIA'),
  componente('acoes-tela', 'Ações da tela', false, 'RECOMENDADA'),
  componente('resultado-esperado', 'Resultado esperado', true, 'OBRIGATORIA'),
  componente('mensagens-sistema', 'Mensagens do sistema', false, 'OPCIONAL'),
];

const BLOCOS_CATALOGO = COMPONENTES_RECOMENDADOS.map(item => ({
  id: item.id,
  nome: item.nome,
  descricao: item.descricao,
  categoria: item.categoria,
  visual: item.visual,
  html: `<section data-bloco="${item.id}"><p>Conteúdo</p></section>`,
  versao: 1,
  slots: [],
}));

function importacaoDocumento(statusPagina = 'PENDENTE', estruturaConfirmada = false) {
  return {
    id: IMPORTACAO_ID,
    nomeArquivo: 'manual-cadastro.txt',
    tipoArquivo: 'TXT',
    mimeType: 'text/plain',
    tamanhoBytes: 256,
    caracteresExtraidos: 220,
    totalPaginasOrigem: 1,
    status: statusPagina === 'EM_EDICAO' ? 'EM_REVISAO' : 'PRONTO_PARA_REVISAO',
    version: statusPagina === 'EM_EDICAO' ? 1 : 0,
    projetoNome: 'Cadastro de produto',
    projetoDescricao: 'Manual criado a partir do documento importado.',
    projetoId: estruturaConfirmada ? '77777777-7777-7777-7777-777777777777' : null,
    clienteId: null,
    estruturaConfirmada,
    projetoNomesSugeridos: ['Cadastro de produto', 'Manual de cadastros'],
    analiseOrigem: 'LLM',
    analiseMensagem: 'Estrutura, nomes e ordem refinados semanticamente pela IA.',
    tokensEntradaAnalise: 500,
    tokensSaidaAnalise: 180,
    sugestoes: [],
    modulos: [
      {
        id: '66666666-6666-6666-6666-666666666666',
        moduloId: estruturaConfirmada ? '88888888-8888-8888-8888-888888888888' : null,
        nome: 'Cadastros',
        ordem: 1,
        paginas: [
          {
            id: PAGINA_PLANO_ID,
            titulo: 'Listagem de registros',
            ordem: 1,
            briefing:
              '# Projeto: Cadastro de produto\n\n## Módulo: Cadastros\n\n' +
              '### Página: Listagem de registros\n\nA tela apresenta filtros, tabela e paginação.',
            templateId: null,
            templateCodigo: 'LISTAR_REGISTROS',
            templateNome: 'Listar e consultar registros',
            confiancaTemplate: 0.9,
            motivoTemplate: 'Listagem e filtros identificados.',
            status: statusPagina,
            paginaId: null,
            sessaoId: null,
            erroMensagem: null,
            origem: 'DOCUMENTO',
            ajustadaManualmente: false,
          },
        ],
      },
    ],
    avisos: [],
    createdAt: AGORA,
    updatedAt: AGORA,
  };
}

export const AI_PROPOSTA_FAKE = {
  id: PROPOSTA_ID,
  sessaoId: SESSAO_ID,
  jobId: JOB_ID,
  tipo: 'NOVA',
  titulo: 'Consulta de pedidos',
  slug: 'consulta-de-pedidos',
  codigoTela: 'PED-CONSULTA',
  resumo: 'Como filtrar e exportar pedidos no portal.',
  conteudoHtml:
    '<section class="doc-intro"><h2>Visão geral</h2><p>Guia E2E.</p></section>' +
    '<div class="screen-placeholder"><strong>Insira captura</strong><span>Substitua pela imagem real da tela.</span></div>',
  templateId: null,
  templateVersao: null,
  pageSpecJson: null,
  aptoParaRevisao: true,
  qualidade: [
    {
      codigo: 'TITULO',
      titulo: 'Título',
      descricao: 'ok',
      ok: true,
      severidade: 'INFO',
    },
  ],
  status: 'PENDENTE',
  paginaId: null,
  createdAt: AGORA,
};

function sessao(status: string, mensagens: unknown[] = [], componentesSelecionados: string[] = []) {
  return {
    id: SESSAO_ID,
    objetivo: 'CRIAR_PAGINA',
    status,
    projetoId: null,
    moduloId: null,
    clienteId: null,
    paginaId: null,
    templateId: null,
    componentesSelecionados,
    briefing: 'x'.repeat(50),
    mensagens,
    createdAt: AGORA,
    updatedAt: AGORA,
  };
}

/** Instala JWT + mocks de auth/RBAC/DocFlow + AI (sem LLM real). */
export async function instalarMocksAiAssistente(page: Page): Promise<void> {
  let statusSessao = 'PRONTA_PARA_GERAR';
  let importacaoRascunho = importacaoDocumento();
  let componentesSelecionados = COMPONENTES_RECOMENDADOS.map(item => item.id);

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
    const path = url.pathname.replace(/^\/api\/ai/, '/api/v1/ai');
    const method = request.method();
    const ctx = { path: url.pathname, method };
    const responder = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (await tryHandleAuthRoutes(ctx, responder, TODAS_PERMISSOES)) return;
    if (await tryHandleRbacRoutes(ctx, responder)) return;

    if (method === 'GET' && path === '/api/v1/ai/status') {
      return responder({
        enabled: true,
        prontoParaGerar: true,
        provider: 'fake',
        model: 'fake',
        mensagem: 'E2E mock',
      });
    }

    if (method === 'POST' && path === '/api/v1/ai/templates/recomendacao') {
      return responder({
        recomendado: {
          templateId: '10000000-0000-0000-0000-000000000004',
          codigo: 'CONSULTA',
          nome: 'Consulta ou listagem',
          descricao: 'Explica filtros, listagem e ações.',
          confianca: 0.91,
          motivo: 'Consulta e filtros identificados no briefing.',
        },
        candidatos: [],
        exigeConfirmacao: false,
        blueprintId: 'consulta-operacional',
        blueprintNome: 'Consulta operacional',
        totalBiblioteca: 45,
        componentes: COMPONENTES_RECOMENDADOS,
      });
    }

    if (method === 'POST' && path === '/api/v1/ai/sessoes') {
      const payload = request.postDataJSON() as { componentesSelecionados?: string[] };
      componentesSelecionados = payload.componentesSelecionados ?? [];
      statusSessao = 'PRONTA_PARA_GERAR';
      return responder(
        sessao(
          statusSessao,
          [
            {
              id: 'm1',
              papel: 'USUARIO',
              conteudo: 'briefing',
              perguntas: [],
              ordem: 1,
              createdAt: AGORA,
            },
            {
              id: 'm2',
              papel: 'ASSISTENTE',
              conteudo: 'Contexto suficiente para gerar.',
              perguntas: [],
              ordem: 2,
              createdAt: AGORA,
            },
          ],
          componentesSelecionados,
        ),
      );
    }

    if (method === 'POST' && path === '/api/v1/ai/importacoes') {
      return responder(importacaoRascunho, 201);
    }

    if (method === 'PUT' && path === `/api/v1/ai/importacoes/${IMPORTACAO_ID}/estrutura/rascunho`) {
      const payload = request.postDataJSON() as {
        modulos: Array<{
          planoId: string;
          nome: string;
          paginas: Array<{
            planoId: string;
            titulo: string;
            conteudo: string;
            origem: string;
            ajustadaManualmente: boolean;
          }>;
        }>;
      };
      type PaginaRascunho = (typeof importacaoRascunho.modulos)[number]['paginas'][number];
      const paginas = new Map<string, PaginaRascunho>();
      importacaoRascunho.modulos.forEach(modulo =>
        modulo.paginas.forEach(pagina => paginas.set(pagina.id, pagina)),
      );
      importacaoRascunho = {
        ...importacaoRascunho,
        version: importacaoRascunho.version + 1,
        modulos: payload.modulos.map((modulo, indiceModulo) => ({
          id: modulo.planoId,
          moduloId: null,
          nome: modulo.nome,
          ordem: indiceModulo + 1,
          paginas: modulo.paginas.map((paginaRascunho, indicePagina) => {
            const pagina = paginas.get(paginaRascunho.planoId);
            return {
              ...(pagina ?? {
                templateId: null,
                templateCodigo: null,
                templateNome: null,
                confiancaTemplate: 0,
                motivoTemplate: 'Modelo pendente.',
                status: 'PENDENTE',
                paginaId: null,
                sessaoId: null,
                erroMensagem: null,
              }),
              id: paginaRascunho.planoId,
              titulo: paginaRascunho.titulo,
              briefing: `# Projeto: Cadastro de produto\n\n## Módulo: ${modulo.nome}\n\n### Página: ${paginaRascunho.titulo}\n\n${paginaRascunho.conteudo}`,
              origem: paginaRascunho.origem,
              ajustadaManualmente: paginaRascunho.ajustadaManualmente,
              ordem: indicePagina + 1,
            };
          }),
        })),
      };
      return responder(importacaoRascunho);
    }

    if (method === 'POST' && path === `/api/v1/ai/importacoes/${IMPORTACAO_ID}/estrutura/confirmar`) {
      importacaoRascunho = {
        ...importacaoRascunho,
        estruturaConfirmada: true,
        projetoId: '77777777-7777-7777-7777-777777777777',
        modulos: importacaoRascunho.modulos.map(modulo => ({
          ...modulo,
          moduloId: '88888888-8888-8888-8888-888888888888',
        })),
      };
      return responder(importacaoRascunho);
    }

    if (
      method === 'POST' &&
      path === `/api/v1/ai/importacoes/${IMPORTACAO_ID}/paginas/${PAGINA_PLANO_ID}/selecionar`
    ) {
      importacaoRascunho = {
        ...importacaoRascunho,
        status: 'EM_REVISAO',
        version: importacaoRascunho.version + 1,
        modulos: importacaoRascunho.modulos.map(modulo => ({
          ...modulo,
          paginas: modulo.paginas.map(pagina => ({
            ...pagina,
            status: pagina.id === PAGINA_PLANO_ID ? 'EM_EDICAO' : pagina.status,
          })),
        })),
      };
      return responder(importacaoRascunho);
    }

    if (method === 'GET' && path === `/api/v1/ai/sessoes/${SESSAO_ID}`) {
      return responder(sessao(statusSessao, [], componentesSelecionados));
    }

    if (method === 'POST' && path === `/api/v1/ai/sessoes/${SESSAO_ID}/gerar`) {
      statusSessao = 'PRONTA';
      return responder(
        {
          id: JOB_ID,
          sessaoId: SESSAO_ID,
          tipo: 'GERAR_RASCUNHO',
          status: 'PENDENTE',
          etapa: 'AGUARDANDO',
          progresso: 0,
          tentativa: 1,
          erroMensagem: null,
          diagnosticoId: null,
          modelo: null,
          tokensEntrada: null,
          tokensSaida: null,
          duracaoMs: 0,
          startedAt: null,
          finishedAt: null,
          heartbeatAt: null,
          cancelRequestedAt: null,
        },
        202,
      );
    }

    if (method === 'GET' && path === `/api/v1/ai/sessoes/${SESSAO_ID}/proposta`) {
      return responder({
        ...AI_PROPOSTA_FAKE,
        pageSpecJson: JSON.stringify({
          schemaVersion: 1,
          blueprintId: 'consulta-operacional',
          blocos: componentesSelecionados.map(componenteId => ({ componenteId })),
        }),
      });
    }

    if (method === 'POST' && path === `/api/v1/ai/sessoes/${SESSAO_ID}/aplicar`) {
      return responder({
        modo: 'FORM',
        propostaId: PROPOSTA_ID,
        paginaId: null,
        titulo: AI_PROPOSTA_FAKE.titulo,
        slug: AI_PROPOSTA_FAKE.slug,
        codigoTela: AI_PROPOSTA_FAKE.codigoTela,
        resumo: AI_PROPOSTA_FAKE.resumo,
        conteudoHtml: AI_PROPOSTA_FAKE.conteudoHtml,
        templateOrigemId: null,
        templateOrigemVersao: null,
        moduloId: null,
      });
    }

    if (method === 'POST' && path.endsWith('/cancelar')) {
      statusSessao = 'CANCELADA';
      return responder(sessao(statusSessao, [], componentesSelecionados));
    }

    if (method === 'GET' && path === '/api/v1/ai/eventos') {
      return route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'event: conectado\ndata: {"status":"OK"}\n\n',
      });
    }

    if (method === 'GET' && path === '/api/v1/docflow/paginas/blocos') {
      return responder(BLOCOS_CATALOGO);
    }

    if (await tryHandleDocFlowRoutes(ctx, responder)) return;
    if (await tryHandleDocFlowFallbackGet(ctx, responder)) return;

    // formulário de página precisa de listas vazias
    if (
      method === 'GET' &&
      (path.includes('/projetos') || path.includes('/modulos') || path.includes('/paginas'))
    ) {
      return responder([]);
    }

    return responder(authMePayload(TODAS_PERMISSOES));
  });
}

function componente(id: string, nome: string, obrigatorio: boolean, necessidade: string) {
  return {
    id,
    nome,
    descricao: `Bloco ${nome}.`,
    categoria: 'Estrutura',
    visual: 'intro',
    necessidade,
    obrigatorio,
    motivo: obrigatorio ? 'Essencial para a página.' : 'Identificado no texto.',
  };
}
