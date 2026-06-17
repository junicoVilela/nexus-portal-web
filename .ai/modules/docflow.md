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

## Estrutura atual

Implementado em `src/app/modules/docflow/` (renomeado de `manual-usuario` em 2026-06-09):

```text
src/app/modules/docflow/
├── models/
│   ├── cliente.model.ts        (Cliente, PreviewToken)
│   ├── projeto.model.ts        (Projeto)
│   ├── modulo.model.ts         (Modulo)
│   ├── pagina.model.ts         (Pagina, StatusPagina, PaginaAnexo, PaginaRevisao, ChangelogItem)
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
GET/POST/PUT   /clientes
GET            /clientes/:id/vinculos
PUT            /clientes/:id/projetos | /modulos | /paginas
POST           /clientes/:id/copiar-vinculos
POST/DELETE    /clientes/:id/logo
GET/POST/PUT   /projetos
GET/POST/PUT   /modulos
GET/POST/PUT   /paginas
POST           /paginas/:id/publicar | /aprovar | /arquivar | /duplicar | /enviar-revisao
GET/POST/DELETE /paginas/:id/anexos
GET/POST/PUT   /publicacoes
GET            /publicacoes/preview | /preview-html | /diagnostico
POST           /publicacoes/:id/reprocessar
GET            /publicacoes/:id/download | /download-pdf | /download-token | /changelog
GET            /preview-tokens
POST/DELETE    /preview-tokens
GET            /paginas/resumo-por-status
POST           /paginas/reordenar
GET            /empresa/logo
POST/DELETE    /empresa/logo
```

## Observações

- Lazy loading: todas as rotas usam `loadComponent`.
- Services retornam Observable — nunca chamar HttpClient em component.
- Usar `PageResult<T>` de `@shared/models/page-result.model.ts` para listas paginadas.
- `buildQueryParams` de `@shared/utils/http-params.util.ts` para montar HttpParams.
