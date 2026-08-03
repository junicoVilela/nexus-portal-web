#!/usr/bin/env node
/**
 * Safely merges missing DocFlow paths and schemas into openapi/nexus-portal-api.json.
 */
const fs = require('fs');
const path = require('path');

const specPath = path.join(__dirname, '..', 'openapi', 'nexus-portal-api.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

const okJson = contentType => ({
  description: 'OK',
  content: { '*/*': { schema: contentType } },
});

const okSse = contentType => ({
  description: 'Server-Sent Events stream',
  content: { 'text/event-stream': { schema: contentType } },
});

const ref = name => ({ $ref: `#/components/schemas/${name}` });

const pageResponse = itemSchema => ({
  type: 'object',
  properties: {
    items: { type: 'array', items: ref(itemSchema) },
    page: { type: 'integer', format: 'int32' },
    size: { type: 'integer', format: 'int32' },
    totalItems: { type: 'integer', format: 'int64' },
    totalPages: { type: 'integer', format: 'int32' },
    first: { type: 'boolean' },
    last: { type: 'boolean' },
  },
});

const tipoAjudaConteudo = {
  type: 'string',
  enum: ['JORNADA', 'ETAPA', 'FAQ', 'ARTIGO', 'TOUR_PASSO', 'ONBOARDING'],
};

const tipoAjudaMedia = {
  type: 'string',
  enum: ['NENHUMA', 'IMAGEM', 'GIF', 'VIDEO', 'GALERIA'],
};

const tipoAjudaEvento = {
  type: 'string',
  enum: [
    'BUSCA',
    'BUSCA_SEM_RESULTADO',
    'CONTEUDO_ABERTO',
    'ETAPA_CONCLUIDA',
    'TOUR_INICIADO',
    'TOUR_CONCLUIDO',
    'TOUR_ABANDONADO',
    'ONBOARDING_CONCLUIDO',
  ],
};

const acaoPaginaEvento = {
  type: 'string',
  enum: ['ENVIAR_REVISAO', 'APROVAR', 'PUBLICAR', 'ARQUIVAR', 'DEVOLVER'],
};

const newSchemas = {
  PaginaEventoResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      titulo: { type: 'string' },
      status: {
        type: 'string',
        enum: ['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO', 'ARQUIVADO'],
      },
      acao: acaoPaginaEvento,
      usuario: { type: 'string' },
    },
  },
  PublicacaoEventoResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      clienteId: { type: 'string', format: 'uuid' },
      status: {
        type: 'string',
        enum: ['GERANDO', 'SUCESSO', 'ERRO'],
      },
      versao: { type: 'string' },
    },
  },
  ReprocessarPublicacoesRequest: {
    type: 'object',
    required: ['ids'],
    properties: {
      ids: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
      },
    },
  },
  ReprocessamentoPublicacoesResponse: {
    type: 'object',
    properties: {
      solicitadas: { type: 'integer', format: 'int32' },
      reprocessadas: { type: 'integer', format: 'int32' },
      ignoradas: { type: 'integer', format: 'int32' },
      publicacoes: {
        type: 'array',
        items: ref('PublicacaoResponse'),
      },
    },
  },
  ComentarioRevisaoRequest: {
    type: 'object',
    required: ['comentario'],
    properties: {
      comentario: { type: 'string' },
    },
  },
  PageResponsePaginaAnexoResponse: pageResponse('PaginaAnexoResponse'),
  DocFlowDashboardResponse: {
    type: 'object',
    properties: {
      totalClientes: { type: 'integer', format: 'int64' },
      totalProjetos: { type: 'integer', format: 'int64' },
      totalModulos: { type: 'integer', format: 'int64' },
      totalPaginas: { type: 'integer', format: 'int64' },
      totalPublicacoes: { type: 'integer', format: 'int64' },
      paginasPendentes: { type: 'integer', format: 'int64' },
      paginasEmRevisao: { type: 'integer', format: 'int64' },
      publicacoesGerando: { type: 'integer', format: 'int64' },
      publicacoesComErro: { type: 'integer', format: 'int64' },
      clientesSemPublicacao: { type: 'integer', format: 'int64' },
      paginasSemResumo: { type: 'integer', format: 'int64' },
      paginasDesatualizadas: { type: 'integer', format: 'int64' },
      taxaSucessoPublicacoes: { type: 'number', format: 'double' },
      paginasPorStatus: {
        type: 'object',
        additionalProperties: { type: 'integer', format: 'int64' },
      },
    },
  },
  AjudaConteudoResponse: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      codigo: { type: 'string' },
      tipo: tipoAjudaConteudo,
      jornadaCodigo: { type: 'string' },
      titulo: { type: 'string' },
      resumo: { type: 'string' },
      conteudo: { type: 'string' },
      rotaContexto: { type: 'string' },
      rotaAcao: { type: 'string' },
      rotuloAcao: { type: 'string' },
      icone: { type: 'string' },
      seletorAlvo: { type: 'string' },
      mediaTipo: tipoAjudaMedia,
      mediaUrls: { type: 'array', items: { type: 'string' } },
      mediaAlt: { type: 'string' },
      ordem: { type: 'integer', format: 'int32' },
      ativo: { type: 'boolean' },
      updatedAt: { type: 'string', format: 'date-time' },
      updatedBy: { type: 'string' },
    },
  },
  AjudaConteudoRequest: {
    type: 'object',
    required: ['codigo', 'tipo', 'titulo'],
    properties: {
      codigo: { type: 'string' },
      tipo: tipoAjudaConteudo,
      jornadaCodigo: { type: 'string' },
      titulo: { type: 'string' },
      resumo: { type: 'string' },
      conteudo: { type: 'string' },
      rotaContexto: { type: 'string' },
      rotaAcao: { type: 'string' },
      rotuloAcao: { type: 'string' },
      icone: { type: 'string' },
      seletorAlvo: { type: 'string' },
      mediaTipo: tipoAjudaMedia,
      mediaUrls: { type: 'array', items: { type: 'string' } },
      mediaAlt: { type: 'string' },
      ordem: { type: 'integer', format: 'int32' },
      ativo: { type: 'boolean' },
    },
  },
  AjudaEventoRequest: {
    type: 'object',
    required: ['tipo'],
    properties: {
      tipo: tipoAjudaEvento,
      conteudoCodigo: { type: 'string' },
      termo: { type: 'string' },
      rota: { type: 'string' },
      sessaoId: { type: 'string' },
      resultadoQuantidade: { type: 'integer', format: 'int32' },
    },
  },
  AjudaMetricaItemResponse: {
    type: 'object',
    properties: {
      chave: { type: 'string' },
      rotulo: { type: 'string' },
      total: { type: 'integer', format: 'int64' },
    },
  },
  AjudaMetricasResponse: {
    type: 'object',
    properties: {
      desde: { type: 'string', format: 'date-time' },
      totalEventos: { type: 'integer', format: 'int64' },
      buscas: { type: 'integer', format: 'int64' },
      buscasSemResultado: { type: 'integer', format: 'int64' },
      toursIniciados: { type: 'integer', format: 'int64' },
      toursConcluidos: { type: 'integer', format: 'int64' },
      taxaConclusaoTour: { type: 'number', format: 'double' },
      conteudosMaisAcessados: {
        type: 'array',
        items: ref('AjudaMetricaItemResponse'),
      },
      buscasFrequentes: {
        type: 'array',
        items: ref('AjudaMetricaItemResponse'),
      },
    },
  },
};

const newPaths = {
  '/api/v1/docflow/paginas/eventos': {
    get: {
      tags: ['pagina-controller'],
      operationId: 'eventosPagina',
      responses: {
        200: okSse(ref('PaginaEventoResponse')),
      },
    },
  },
  '/api/v1/docflow/publicacoes/eventos': {
    get: {
      tags: ['publicacao-controller'],
      operationId: 'eventosPublicacao',
      responses: {
        200: okSse(ref('PublicacaoEventoResponse')),
      },
    },
  },
  '/api/v1/docflow/publicacoes/reprocessar-lote': {
    post: {
      tags: ['publicacao-controller'],
      operationId: 'reprocessarLote',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('ReprocessarPublicacoesRequest') },
        },
      },
      responses: {
        200: okJson(ref('ReprocessamentoPublicacoesResponse')),
      },
    },
  },
  '/api/v1/docflow/paginas/anexos': {
    get: {
      tags: ['pagina-controller'],
      operationId: 'bibliotecaAnexos',
      parameters: [
        { name: 'busca', in: 'query', required: false, schema: { type: 'string' } },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', format: 'int32', default: 1 },
        },
        {
          name: 'size',
          in: 'query',
          required: false,
          schema: { type: 'integer', format: 'int32', default: 24 },
        },
      ],
      responses: {
        200: okJson(ref('PageResponsePaginaAnexoResponse')),
      },
    },
  },
  '/api/v1/docflow/paginas/{id}/revisoes/comentarios': {
    post: {
      tags: ['pagina-controller'],
      operationId: 'comentarRevisao',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('ComentarioRevisaoRequest') },
        },
      },
      responses: {
        200: okJson(ref('PaginaRevisaoResponse')),
      },
    },
  },
  '/api/v1/docflow/dashboard/resumo': {
    get: {
      tags: ['doc-flow-dashboard-controller'],
      operationId: 'resumo',
      responses: {
        200: okJson(ref('DocFlowDashboardResponse')),
      },
    },
  },
  '/api/v1/docflow/ajuda/conteudos': {
    get: {
      tags: ['ajuda-controller'],
      operationId: 'listarAjuda',
      parameters: [
        { name: 'busca', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'rota', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: {
        200: okJson({ type: 'array', items: ref('AjudaConteudoResponse') }),
      },
    },
    post: {
      tags: ['ajuda-controller'],
      operationId: 'criarAjuda',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('AjudaConteudoRequest') },
        },
      },
      responses: {
        201: okJson(ref('AjudaConteudoResponse')),
      },
    },
  },
  '/api/v1/docflow/ajuda/conteudos/admin': {
    get: {
      tags: ['ajuda-controller'],
      operationId: 'listarAjudaAdmin',
      responses: {
        200: okJson({ type: 'array', items: ref('AjudaConteudoResponse') }),
      },
    },
  },
  '/api/v1/docflow/ajuda/conteudos/{id}': {
    put: {
      tags: ['ajuda-controller'],
      operationId: 'atualizarAjuda',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('AjudaConteudoRequest') },
        },
      },
      responses: {
        200: okJson(ref('AjudaConteudoResponse')),
      },
    },
    delete: {
      tags: ['ajuda-controller'],
      operationId: 'excluirAjuda',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        204: { description: 'No Content' },
      },
    },
  },
  '/api/v1/docflow/ajuda/eventos': {
    post: {
      tags: ['ajuda-controller'],
      operationId: 'registrarAjudaEvento',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: ref('AjudaEventoRequest') },
        },
      },
      responses: {
        204: { description: 'No Content' },
      },
    },
  },
  '/api/v1/docflow/ajuda/metricas': {
    get: {
      tags: ['ajuda-controller'],
      operationId: 'metricasAjuda',
      responses: {
        200: okJson(ref('AjudaMetricasResponse')),
      },
    },
  },
};

let schemasAdded = 0;
for (const [name, schema] of Object.entries(newSchemas)) {
  if (!spec.components.schemas[name]) {
    spec.components.schemas[name] = schema;
    schemasAdded++;
  }
}

let pathsAdded = 0;
for (const [pathKey, pathItem] of Object.entries(newPaths)) {
  if (!spec.paths[pathKey]) {
    spec.paths[pathKey] = pathItem;
    pathsAdded++;
  } else {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!spec.paths[pathKey][method]) {
        spec.paths[pathKey][method] = operation;
        pathsAdded++;
      }
    }
  }
}

fs.writeFileSync(specPath, JSON.stringify(spec));
console.log(`Patched ${specPath}: +${pathsAdded} path operations, +${schemasAdded} schemas.`);
