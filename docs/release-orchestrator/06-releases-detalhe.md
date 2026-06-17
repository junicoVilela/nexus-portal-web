# Tela: Detalhe da Release

## Identificação

- **Componente**: `ReleaseDetalheComponent` (`pages/releases/detalhe/release-detalhe.component.ts`)
- **Rota**: `/release-orchestrator/releases/:id`
- **Resolver**: `releaseResolver` (pré-carrega `data['release']`)

## Objetivo

Visualizar/gerenciar uma release: cabeçalho, abas **Itens** e **Histórico**, transições de status, edição de itens (CRUD + reordenar + duplicar) e geração de PDF.

## Estado (signals)

`loading`, `erro`, `erroVariant`, `salvandoItem`, `release`, `itens`, `historico`, `showItemForm`, `editItemId`, `activeTab` (`'itens'|'historico'`).

**Computados**: `tabsConfig` (com contagem de itens), `podeEditarRelease` (via `podeEditar(status)`), `itensPorCategoria` (agrupa por categoria ordenada, só não vazias).

## Carregamento

- Usa `release` pré-resolvida se presente; senão `carregar()` (`buscarPorId`).
- `carregarItens()` → `ReleaseItemService.listar`.
- `carregarHistorico()` → `ReleaseService.listarHistorico`.

## Aba Itens

Form `itemForm`:

| Campo | Validação |
|---|---|
| `categoria` | obrigatório (default `NOVIDADE`) |
| `titulo` | obrigatório, maxLength 200 |
| `descricao` | opcional |
| `visibilidade` | obrigatório (default `TODOS`) |
| `ticket`, `commit`, `pullRequest` | opcional |

Ações: `abrirNovoItem`, `editarItem`, `salvarItem` (criar/atualizar), `removerItem`, `duplicarItem`, `onItemDrop` (drag-drop por categoria → `reordenar`). Edição só visível quando `podeEditarRelease`.

## Transições de status

`alterarStatus(status)` → `ReleaseService.alterarStatus`. Fluxo conforme `RELEASE_STATUS_FLOW`:

- RASCUNHO → EM_DESENVOLVIMENTO / CANCELADA
- EM_DESENVOLVIMENTO → EM_REVISAO / CANCELADA
- EM_REVISAO → APROVADA / RASCUNHO / CANCELADA
- APROVADA → PUBLICADA / EM_REVISAO / CANCELADA
- `irParaRevisao()` → navega para `/revisao`.

## PDF

`gerarPdf()` → `ReleasePdfService.download(id,'INTERNO','SIGLA-versao.pdf')`.

## Aba Histórico

`HistoricoTimelineComponent` (`app-historico-timeline`): recebe `historico`; usa `ACAO_HISTORICO_*` (labels, ícones Lucide, tons) e mapeia status anterior/novo.

## Estados de UI

`SkeletonComponent` (loading), `EmptyStateComponent` (sem itens), `ErrorStateComponent` (erro classificado). `ReleaseStatusBadgeComponent` no cabeçalho.

## Backend consumido

`GET /releases/{id}`, `GET /releases/{id}/historico`, `GET/POST/PUT/DELETE /releases/{id}/itens...`, `PATCH /releases/{id}/status`, `GET /releases/{id}/pdf` (ver ressalva).
