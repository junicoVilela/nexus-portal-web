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

function sessao(status: string, mensagens: unknown[] = []) {
  return {
    id: SESSAO_ID,
    objetivo: 'CRIAR_PAGINA',
    status,
    projetoId: null,
    moduloId: null,
    clienteId: null,
    paginaId: null,
    templateId: null,
    briefing: 'x'.repeat(50),
    mensagens,
    createdAt: AGORA,
    updatedAt: AGORA,
  };
}

/** Instala JWT + mocks de auth/RBAC/DocFlow + AI (sem LLM real). */
export async function instalarMocksAiAssistente(page: Page): Promise<void> {
  let statusSessao = 'PRONTA_PARA_GERAR';

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

    if (method === 'POST' && path === '/api/v1/ai/sessoes') {
      statusSessao = 'PRONTA_PARA_GERAR';
      return responder(sessao(statusSessao, [
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
      ]));
    }

    if (method === 'GET' && path === `/api/v1/ai/sessoes/${SESSAO_ID}`) {
      return responder(sessao(statusSessao));
    }

    if (method === 'POST' && path === `/api/v1/ai/sessoes/${SESSAO_ID}/gerar`) {
      statusSessao = 'PRONTA';
      return responder(
        {
          id: JOB_ID,
          sessaoId: SESSAO_ID,
          tipo: 'GERAR_RASCUNHO',
          status: 'PENDENTE',
          erroMensagem: null,
          modelo: null,
          startedAt: null,
          finishedAt: null,
        },
        202,
      );
    }

    if (method === 'GET' && path === `/api/v1/ai/sessoes/${SESSAO_ID}/proposta`) {
      return responder(AI_PROPOSTA_FAKE);
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
      return responder(sessao(statusSessao));
    }

    if (method === 'GET' && path === '/api/v1/ai/eventos') {
      return route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'event: conectado\ndata: {"status":"OK"}\n\n',
      });
    }

    if (await tryHandleDocFlowRoutes(ctx, responder)) return;
    if (await tryHandleDocFlowFallbackGet(ctx, responder)) return;

    // formulário de página precisa de listas vazias
    if (method === 'GET' && (path.includes('/projetos') || path.includes('/modulos') || path.includes('/paginas'))) {
      return responder([]);
    }

    return responder(authMePayload(TODAS_PERMISSOES));
  });
}
