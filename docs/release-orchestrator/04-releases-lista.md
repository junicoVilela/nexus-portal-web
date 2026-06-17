# Tela: Lista de Releases

## Identificação

- **Componente**: `ReleasesListComponent` (`pages/releases/list/releases-list.component.ts`)
- **Rota**: `/release-orchestrator/releases`
- **Layout**: `ListPageComponent` (`@shared/layouts`)

## Objetivo

Listar releases com filtros persistidos, paginação, seleção em massa (bulk actions), comparação de 2 releases e ações por linha.

## Estado (signals)

| Signal | Uso |
|---|---|
| `loading`, `erro`, `erroVariant` | estados de carga |
| `releases` | itens da página |
| `produtos` | opções de filtro |
| `totalItems`, `page`(1), `pageSize`(15) | paginação |
| `comparandoIds` | `{left,right}` p/ comparação |
| `selecionados` | `Set<string>` de ids |
| `confirmandoId`, `excluindoId` | confirmação inline |
| **computados** | `totalSelecionados`, `todosVisiveisSelecionados`, `podeComparar` (==2), `filtrosAtivos` |

## Filtros (`filtros`)

`q`, `produtoId`, `status`, `tipo`, `dataPrevistaInicio/Fim`, `dataPublicacaoInicio/Fim`.

- Busca livre com **debounce 300ms** (`busca$`).
- Persistência via `carregarFiltros/salvarFiltros('release-orchestrator:releases')`.
- `FilterPresetsComponent` (presets aplicáveis), `mostrarFiltrosAvancados` (toggle datas).
- `limparFiltros()` reseta tudo.

## Ações por linha

- Navegar para detalhe (linha/`RouterLink`).
- `duplicar(rel)` → `ReleaseService.duplicar` → navega para a cópia.
- `cancelar(rel)` (confirmação inline `confirmandoId`).
- `excluir(rel)` (`excluindoId`; bloqueado se `PUBLICADA` via `podeExcluir`).
- `gerarPdf(rel)` → `ReleasePdfService.download(id,'INTERNO', SIGLA-versao.pdf)`.

## Bulk actions (`BulkActionBarComponent`)

- Seleção: `toggleSelecionado`, `toggleSelecionarTodos`, `limparSelecao`.
- `compararSelecionados()` (exatamente 2) → abre `ReleaseCompareComponent`.
- `cancelarSelecionados()` / `excluirSelecionados()` com `ConfirmService` (modal `danger`); ignoram `PUBLICADA`/`CANCELADA` conforme regra.

## Comparação (`ReleaseCompareComponent`)

`app-release-compare` recebe `leftId`/`rightId`, faz `forkJoin` de 2 releases + 2 listas de itens e agrupa por categoria (lado a lado). Emite `fechar`. **É comparação de itens de changelog**, não de código.

## Paginação / ordenação

`TablePaginationComponent` (`onPageChange`). Ordenação default no backend = `updatedAt DESC`.

## Estados de UI

Loading/erro/vazio via `ListPageComponent` + `ErrorStateComponent`. Badges via `ReleaseStatusBadgeComponent`.

## Backend consumido

`GET /releases` (com filtros), `POST /releases/{id}/duplicar`, `POST /releases/{id}/cancelar`, `DELETE /releases/{id}`, `GET /releases/{id}/pdf` (ver ressalva PDF), `GET /produtos`.

## Observações / drift

- Filtros de **data** (`dataPrevista*`, `dataPublicacao*`) são enviados pelo front, mas o `GET /releases` do backend **não os aceita** → filtro de data não tem efeito.
