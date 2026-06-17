# 03 — Páginas

Inventário das telas. Para detalhes de componentes shared, ver `05-componentes-e-padroes-ui.md`. Para o editor de página em específico, ver `06-editor-paginas.md`.

---

## 1. Dashboard (`pages/dashboard/`)

**Rota**: `/doc-flow`

- KPIs por cliente/projeto/módulo/página.
- Listagem dos itens mais recentes.
- Resumo por status editorial (RASCUNHO/EM_REVISAO/APROVADO/PUBLICADO/ARQUIVADO).

---

## 2. Busca global (`pages/busca-global/`)

**Rota**: `/doc-flow/busca`

- Busca full-text que cruza clientes, projetos, módulos, páginas e publicações.
- Cada seção mostra inline empty quando não há resultados.

---

## 3. Clientes

### Lista (`pages/clientes/clientes-list/`)
**Rota**: `/doc-flow/clientes`

- `ListPageComponent` com filtros, paginação, ações de criação.
- Gerenciamento de vínculos (projetos/módulos/páginas que o cliente enxerga).
- Botão "copiar vínculos" — replica seleção de outro cliente.

### Form (`pages/clientes/cliente-form/`)
**Rota**: `/doc-flow/clientes/novo` ou `/doc-flow/clientes/:id/editar`

- Upload de logo (com preview).
- Remover logo passa por `ConfirmService` (variant: danger).

---

## 4. Projetos, Módulos

Listas + forms padrão. `ListPageComponent` com paginação. Forms simples com `FormPageComponent`.

---

## 5. Páginas (`pages/paginas/`)

### Lista (`paginas-list/`)
**Rota**: `/doc-flow/paginas`

- Tabela hierárquica (parent/child) com indentação visual.
- Filtros por projeto, módulo, status, busca, código de tela.
- Status pills no topo para filtrar rapidamente.
- **Drag-and-drop** para mudar hierarquia (drop em outra linha = vira filha; drop na área "raiz" = sai da hierarquia).
- **Botões mover para cima/baixo** (ícones `ArrowUp`/`ArrowDown`) — usa `reordenarPaginas` do service para reordenar entre irmãos do mesmo módulo/parent.
- Ações por linha: editar, duplicar, enviar revisão, aprovar, publicar, arquivar.
- Arquivar passa por `ConfirmService`.
- Status renderizado via `<app-pagina-status-badge>`.

### Form (`pagina-form/`)
**Rota**: `/doc-flow/paginas/novo` ou `/doc-flow/paginas/:id/editar`

Ver `06-editor-paginas.md` para detalhes (editor HTML, atalhos, anexos, auto-save).

---

## 6. Publicações (`pages/publicacoes/`)

### Lista (`publicacoes-list/`)
**Rota**: `/doc-flow/publicacoes`

- Histórico com status (`GERANDO` / `SUCESSO` / `ERRO`).
- Polling automático enquanto houver publicações `GERANDO` (`TIMINGS.publicacoesPollIntervalMs`).

### Form (`publicacao-form/`)
**Rota**: `/doc-flow/publicacoes/novo`

- Selecione cliente → "Visualizar páginas" carrega o preview de páginas elegíveis.
- "Gerar pacote" cria a publicação assíncrona no backend.

### Detalhe (`publicacao-detalhe/`)
**Rota**: `/doc-flow/publicacoes/:id/detalhe`

- Visão geral + changelog + downloads (ZIP/PDF/token).
- Botão de reprocessar quando status permite.
- TODO: virar tabs (Visão Geral / Páginas incluídas / Changelog / Downloads) — ver `99`.

---

## Cross-references

- [`04-services-e-models.md`](04-services-e-models.md) — endpoints e DTOs por entidade.
- [`05-componentes-e-padroes-ui.md`](05-componentes-e-padroes-ui.md) — status badges, dialog, empty states.
- [`06-editor-paginas.md`](06-editor-paginas.md) — editor + auto-save + canDeactivate.
