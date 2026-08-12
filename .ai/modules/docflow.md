# Feature DocFlow

## Objetivo

Interface interna para criação, edição, organização e publicação de documentação técnica (manuais de usuário) por cliente/projeto.

## Domínio real implementado

```
Cliente → Projeto → Módulo → Página → Publicação
```

- **Cliente**: tenant que recebe a documentação publicada.
- **Projeto**: agrupa módulos de documentação (ex.: um sistema interno).
- **Módulo**: agrupa páginas relacionadas dentro de um projeto.
- **Página**: unidade de conteúdo HTML editável com status editorial (rascunho → revisão → aprovado → publicado → arquivado).
- **Publicação**: geração de pacote ZIP por cliente em uma versão específica.

O editor de página usa autosave persistido, backup local, `version` para concorrência otimista,
checklist editorial e prévia HTML fornecida pelo renderizador do backend. O catálogo possui
20 modelos visuais responsivos, 45 componentes canônicos e 10 blueprints editoriais. Modelos
oferecem páginas completas; blueprints recombinam somente os componentes necessários sem
duplicar HTML. A biblioteca do editor insere blocos sem substituir o conteúdo atual, com busca textual e
abertura contextual pelo comando `/` em uma linha vazia. A prévia inclui um organizador
de seções com drag-and-drop e controles de subir/descer; a nova ordem atualiza o HTML e
participa do autosave existente. O organizador também permite duplicar, excluir com
confirmação e desfazer até 20 alterações da sessão, além de exibir o estado do autosave.
O catálogo aceita modelos personalizados por projeto ou cliente, criados a partir do HTML
atual e administrados na mesma galeria sem permitir exclusão dos modelos de sistema.
Os modelos também possuem aplicação contextual com variáveis, filtro de compatibilidade,
edição, duplicação, arquivamento e histórico imutável. Páginas registram o modelo e a versão
de origem sem acoplar seu conteúdo às alterações posteriores do catálogo.
Antes de aplicar, cada modelo pode ser pré-visualizado com as variáveis resolvidas para o
contexto atual. O primeiro autosave preserva o catálogo e a prévia abertos.

As rotas e ações sensíveis usam permissões RBAC `DOMINIO:ACAO`. Exceções de runtime passam
por `GlobalErrorHandler`; erros HTTP passam pelos interceptors e pelo host global de toast.
Projetos, módulos e templates usam cache leve com TTL e invalidação após mutações.

O contrato do backend está versionado em `frontend/openapi/nexus-portal-api.json` e gera o
cliente Angular em `frontend/src/app/api/generated/` por `npm run api:generate`. O fluxo E2E
`e2e/docflow-golden-flow.spec.ts` cobre criação estrutural, prévia, workflow editorial,
permissões, axe/WCAG e layout mobile sem depender de backend real.

As operações do catálogo de templates já consomem o SDK OpenAPI gerado. A listagem de
publicações acompanha `GET /publicacoes/eventos` por SSE autenticado e cai para polling
visibilidade-aware quando o stream não está disponível. O catálogo exibe indicadores de uso,
e o histórico oferece comparação visual entre duas versões.

## Estrutura atual

Implementado em `src/app/modules/docflow/` (renomeado de `manual-usuario` em 2026-06-09):

```text
src/app/modules/docflow/
├── models/
│   ├── cliente.model.ts        (Cliente, PreviewToken)
│   ├── projeto.model.ts        (Projeto)
│   ├── modulo.model.ts         (Modulo)
│   ├── pagina.model.ts         (Pagina, StatusPagina, PaginaAnexo, PaginaRevisao, PaginaTemplate, ChangelogItem)
│   └── publicacao.model.ts     (Publicacao, StatusPublicacao)
├── services/
│   ├── cliente.service.ts
│   ├── projeto.service.ts
│   ├── modulo.service.ts
│   ├── pagina.service.ts
│   └── publicacao.service.ts
├── pages/
│   ├── dashboard/dashboard/
│   ├── clientes/clientes-list/ + cliente-form/
│   ├── projetos/projetos-list/ + projeto-form/
│   ├── modulos/modulos-list/ + modulo-form/
│   ├── paginas/paginas-list/ + pagina-form/
│   ├── publicacoes/publicacoes-list/ + publicacao-form/ + publicacao-detalhe/
│   └── busca-global/
├── components/
│   └── pagina-status-badge/   ← <app-pagina-status-badge [status]>
└── docflow.routes.ts          ← DOCFLOW_ROUTES
```

Para spec frontend completa, ver `docs/docflow/` (00-06 + 99).

## Rotas

```text
/                          → dashboard
/clientes                  → listagem + vínculos
/clientes/novo             → formulário
/clientes/:id/editar       → formulário
/projetos                  → listagem
/projetos/novo             → formulário
/projetos/:id/editar       → formulário
/modulos                   → listagem filtrada por projeto
/modulos/novo              → formulário
/modulos/:id/editar        → formulário
/paginas                   → listagem com filtros e status editorial
/paginas/novo              → editor HTML
/paginas/:id/editar        → editor HTML
/publicacoes               → histórico de publicações
/publicacoes/novo          → geração de pacote
/publicacoes/:id/detalhe   → detalhe + changelog
/busca                     → busca full-text em páginas
```

## API

Base: `/api/doc-flow`

```text
GET/POST/PUT/DELETE /clientes
GET            /clientes/:id/vinculos
PUT            /clientes/:id/projetos | /modulos | /paginas
POST           /clientes/:id/copiar-vinculos
POST/DELETE    /clientes/:id/logo
GET/POST/PUT/DELETE /projetos
GET/POST/PUT/DELETE /modulos
GET/POST/PUT/DELETE /paginas
POST           /paginas/:id/publicar | /aprovar | /arquivar | /duplicar | /enviar-revisao
GET/POST/DELETE /paginas/:id/anexos
GET/POST/PUT   /publicacoes
DELETE         /publicacoes/:id
GET            /publicacoes/preview | /preview-html | /diagnostico
POST           /publicacoes/:id/reprocessar
GET            /publicacoes/:id/download | /download-pdf | /download-token | /changelog
GET            /publicacoes/eventos (SSE)
GET            /preview-tokens
POST/DELETE    /preview-tokens
GET            /paginas/resumo-por-status
POST           /paginas/reordenar
GET            /empresa/logo
POST/DELETE    /empresa/logo
```

## Assistente IA (dentro do DocFlow)

UI em `frontend/src/app/modules/docflow/`:

- Rotas `/doc-flow/assistente`, `/doc-flow/propostas-ia` (redirect `/ai/**` → assistente)
- Pages: `pages/assistente/`, `pages/propostas-ia/`
- Components: `components/ai-perguntas/`, `components/ai-proposta-preview/`
- Services: `services/ai-assistente.service.ts`, `services/ai-feature.service.ts`
- `environment.aiApiUrl` → `/api/ai` (proxy `/api/v1/ai`)
- CTA: lista de páginas → **Criar com IA** (`?origem=ia`)
- Feature flag: `AiFeatureService` (`GET /ai/status`)
- Docs: `docs/ai/README.md`, `docs/docflow/07-assistente-ia-paginas.md`
- E2E: `e2e/ai-assistente-flow.spec.ts` (intercept, sem LLM)
- O assistente consulta os blueprints em `GET /api/v1/docflow/paginas/blueprints` e explica a
  estrutura editorial associada ao modelo sugerido ou escolhido.

## Observações

- Lazy loading: todas as rotas usam `loadComponent`.
- Services retornam Observable — nunca chamar HttpClient em component.
- Usar `PageResult<T>` de `@shared/models/page-result.model.ts` para listas paginadas.
- `buildQueryParams` de `@shared/utils/http-params.util.ts` para montar HttpParams.
- Assistente IA → dentro de `modules/docflow/` (não criar módulo Angular separado).
