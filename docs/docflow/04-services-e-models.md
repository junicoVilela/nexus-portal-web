# 04 — Services e Models

Base da API: `${environment.apiUrl}/...` apontando para `/api/doc-flow` no backend.

## 1. Cliente

### Service (`cliente.service.ts`)

```text
GET    /clientes                       → PageResult<Cliente>
GET    /clientes/:id                   → Cliente
POST   /clientes                       → Cliente
PUT    /clientes/:id                   → Cliente
DELETE /clientes/:id                   → exclui cliente sem publicações
GET    /clientes/:id/vinculos          → { projetoIds, moduloIds, paginaIds }
PUT    /clientes/:id/projetos          → atualiza vínculo de projetos
PUT    /clientes/:id/modulos           → atualiza vínculo de módulos
PUT    /clientes/:id/paginas           → atualiza vínculo de páginas
POST   /clientes/:id/copiar-vinculos   → replica vínculos de outro cliente
POST   /clientes/:id/logo              → upload (multipart)
DELETE /clientes/:id/logo              → remove logo
GET    /preview-tokens                 → PreviewToken[]
POST   /preview-tokens                 → gera token
DELETE /preview-tokens/:id             → revoga
GET    /empresa/logo                   → logo global
POST   /empresa/logo                   → upload (multipart)
DELETE /empresa/logo                   → remove
```

### Model (`cliente.model.ts`)

- `Cliente { id, nome, sigla, ativo, logoUrl?, ... }`
- `PreviewToken { id, clienteId, token, criadoEm, validadeSegundos, urlPath, ... }`

---

## 2. Projeto

### Service (`projeto.service.ts`)

```text
GET    /projetos          → PageResult<Projeto>
GET    /projetos/:id      → Projeto
POST   /projetos          → cria
PUT    /projetos/:id      → atualiza
DELETE /projetos/:id      → exclui projeto sem módulos
```

### Model (`projeto.model.ts`)

- `Projeto { id, nome, sigla, descricao?, ativo, ... }`

---

## 3. Módulo

### Service (`modulo.service.ts`)

```text
GET    /modulos           → PageResult<Modulo>
GET    /modulos/:id       → Modulo
POST   /modulos           → cria
PUT    /modulos/:id       → atualiza
DELETE /modulos/:id       → exclui módulo sem páginas
```

### Model (`modulo.model.ts`)

- `Modulo { id, nome, projetoId, projetoNome, ativo, ordem, ... }`

---

## 4. Página

### Service (`pagina.service.ts`)

```text
GET    /paginas                            → PageResult<Pagina>
GET    /paginas/:id                        → Pagina
PUT    /paginas/:id/autosave               → atualiza rascunho com concorrência otimista
GET    /paginas/:id/qualidade              → checklist editorial
GET    /paginas/:id/preview                → prévia HTML fiel
POST   /paginas                            → cria
PUT    /paginas/:id                        → atualiza
DELETE /paginas/:id                        → exclui página sem subpáginas
POST   /paginas/:id/salvar-rascunho        → marca rascunho
POST   /paginas/:id/publicar               → workflow
POST   /paginas/:id/enviar-revisao         → workflow
POST   /paginas/:id/aprovar                → workflow
POST   /paginas/:id/arquivar               → workflow
POST   /paginas/:id/duplicar               → cópia
GET    /paginas/:id/revisoes               → PageResult<PaginaRevisao>
POST   /paginas/:id/revisoes/comentarios   → registra comentário editorial
GET    /paginas/anexos                     → PageResult<PaginaAnexo> (biblioteca global)
GET    /paginas/:id/anexos                 → PaginaAnexo[]
POST   /paginas/:id/anexos                 → upload (multipart)
DELETE /paginas/:paginaId/anexos/:anexoId  → remove
GET    /paginas/resumo-por-status          → Record<status, number>
POST   /paginas/reordenar { paginaIds[] }  → reordena pelo array
```

### Model (`pagina.model.ts`)

- `Pagina { id, titulo, slug, codigoTela, resumo?, conteudoHtml?, status, ordem, ativo, moduloId, moduloNome, projetoId, projetoNome, parentId?, parentTitulo?, publishedAt?, createdAt?, updatedAt?, createdBy?, updatedBy? }`
- `StatusPagina = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'PUBLICADO' | 'ARQUIVADO'`
- `PaginaAnexo { id, paginaId, paginaTitulo, nomeOriginal, contentType, tamanhoBytes, createdAt, createdBy?, downloadUrl }`
- `PaginaRevisao { id, numero, titulo, status, tipo, descricao, resumo?, conteudoHtml?, createdAt, createdBy? }`
- `ChangelogItem { id, paginaId?, paginaTitulo, tipoMudanca, createdAt }`

---

## 5. Publicação

### Service (`publicacao.service.ts`)

```text
GET    /publicacoes                       → PageResult<Publicacao> (cliente, status e paginação)
GET    /publicacoes/eventos               → stream SSE de mudanças de status
GET    /publicacoes/:id                   → Publicacao
GET    /publicacoes/preview               → Pagina[] (páginas elegíveis)
GET    /publicacoes/preview-html          → text/html (preview renderizado)
GET    /publicacoes/diagnostico           → diagnóstico de geração
POST   /publicacoes                       → cria
POST   /publicacoes/:id/reprocessar       → re-gera
POST   /publicacoes/reprocessar-lote      → re-gera até 100 publicações
DELETE /publicacoes/:id                   → exclui registro, changelog e pacote ZIP
GET    /publicacoes/:id/download          → ZIP (blob)
GET    /publicacoes/:id/download-token    → { token, validadeSegundos, urlPath }
GET    /publicacoes/:id/download-pdf      → PDF (blob)
GET    /publicacoes/:id/changelog         → ChangelogItem[]
```

### Model (`publicacao.model.ts`)

- `Publicacao { id, clienteId, clienteNome, versao, status, criadoEm, finalizadoEm?, ... }`
- `StatusPublicacao = 'GERANDO' | 'SUCESSO' | 'ERRO'`

---

## 6. Dashboard

```text
GET /dashboard/resumo → totais estruturais, fila editorial, saúde do conteúdo e taxa de sucesso
```

O resumo é agregado no servidor; o frontend não baixa catálogos inteiros para calcular KPIs.

---

## 7. Ajuda interativa

```text
GET    /ajuda/conteudos             → conteúdo ativo com jornadas, etapas, FAQs e tour
GET    /ajuda/conteudos/admin       → catálogo completo, incluindo inativos
POST   /ajuda/conteudos             → cria conteúdo administrável
PUT    /ajuda/conteudos/:id         → atualiza texto, contexto, ação e mídia
DELETE /ajuda/conteudos/:id         → exclui conteúdo
POST   /ajuda/eventos               → registra busca, acesso, onboarding e tour
GET    /ajuda/metricas              → resumo e rankings dos últimos 30 dias
```

`AjudaService` mantém um catálogo padrão como fallback, combina a ajuda com a busca global e
fornece conteúdo contextual pela rota atual. Imagens, GIFs, vídeos e galerias usam URLs
administradas; o progresso pessoal permanece no navegador.

Etapas sempre pertencem a uma jornada válida. Jornadas com etapas não podem ser excluídas nem
convertidas para outro tipo até que suas etapas sejam movidas ou removidas. Eventos equivalentes
da mesma sessão são deduplicados no backend e o onboarding só registra a primeira conclusão.

---

## 8. Convenções

- Filtros: passar via `buildQueryParams(filtros)` (drops undefined/null/empty).
- Paginação: 1-based `page` + `size`. Backend devolve `PageResult<T> = { items, totalItems, page, size }`.
- Upload: `FormData` com chave `file`.
- Download: `responseType: 'blob'` + `URL.createObjectURL` no component.
