# Tela: Produtos

## Identificação

- **Componente**: `RfProdutosComponent` (`pages/produtos/rf-produtos.component.ts`)
- **Rota**: `/release-orchestrator/produtos`
- **Permissão de menu**: `PRODUTO:LER`

## Objetivo

CRUD de produtos com filtro client-side por nome/sigla, formulário inline e seletor de cor.

## Estado (signals)

`loading`, `salvando`, `erro`, `erroVariant`, `produtos`, `showForm`, `editId`, `excluindoId`. `filtroNome` (string). Computado `produtosFiltrados` (filtra por nome/sigla, lowercase).

## Form (`buildForm`)

| Campo | Validação |
|---|---|
| `nome` | obrigatório, maxLength 100 |
| `sigla` | obrigatório, maxLength 20 |
| `descricao` | opcional |
| `cor` | obrigatório (default `#2563eb`) |
| `responsavelId` | opcional |
| `ativo` | default `true` |

- Paleta `PRESET_CORES` (10 cores) + `escolherCor`.

## Ações

- `abrirNovo`, `editar(p)` (`patchValue`), `fecharForm`.
- `salvar()`: `criar`/`atualizar` (atualiza lista local otimista).
- `excluir(p)`: erro tratado ("Remova as releases vinculadas antes.").
- `toggleAtivo(p)`: `ProdutoService.alterarStatus`.
- Filtro persistido em `release-orchestrator:produtos` (`salvarFiltro`).

## Estados de UI

`SkeletonComponent`, `EmptyStateComponent`, `ErrorStateComponent` (`classificarErro`).

## Backend consumido

`GET /produtos`, `POST /produtos`, `PUT /produtos/{id}`, `PATCH /produtos/{id}/status`, `DELETE /produtos/{id}`. (Há também `uploadLogo` no service, **sem UI** correspondente nesta tela.)

## Observações

- `ProdutoService.listarTodos()` tem cache (TTL `TIMINGS.serviceCacheTtlMs`), invalidado em create/update/status/delete. Esta tela usa `listar()` (paginado) e não o cache.
