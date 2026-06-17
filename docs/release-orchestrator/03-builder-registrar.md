# Tela: Registrar (Builder)

## Identificação

- **Componente**: `ReleaseBuilderComponent` (`pages/builder/release-builder.component.ts`)
- **Rota**: `/release-orchestrator/builder`
- **Permissão de menu**: `RELEASE:CRIAR`

## Objetivo

Registro rápido em 3 passos: (1) criar a release, (2) adicionar entradas/itens ao vivo por categoria, (3) encerrar enviando para revisão.

## Estado (signals)

- **Cabeçalho da release**: `releaseForm` (FormGroup), `produtos`, `release`, `criandoRelease`, `erroCriar`, `releaseAberta`.
- **Builder de entradas**: `entradaForm`, `entradas` (`EntradaLocal[]`), `encerrando`, `categoriaAtiva`.
- **Computados**: `podeSalvar` (há entradas e nenhuma salvando), `versaoDisplay` (`SIGLA vX.Y.Z`).

## Passo 1 — criar release (`iniciarRelease()`)

Form `releaseForm`:

| Campo | Validação |
|---|---|
| `produtoId` | obrigatório |
| `versao` | obrigatório, regex `^\d+\.\d+(\.\d+)?(-\w+)?$` |
| `titulo` | obrigatório |
| `tipo` | obrigatório (default `MINOR`) |
| `dataPrevista` | opcional |
| `resumo` | opcional |

- Chama `ReleaseService.criar({ ...form, status: 'EM_DESENVOLVIMENTO' })`.
- Sucesso → `release.set`, `releaseAberta=true`, foca input de entrada.
- Erro → `erroCriar` ("Cadastre um produto e verifique a API.").

## Passo 2 — entradas (`adicionarEntrada()`)

Form `entradaForm`: `titulo` (obrigatório), `descricao`, `ticket`, `commit`.

- `selecionarCategoria(cat)` define `categoriaAtiva` (9 categorias de `CATEGORIAS_ORDENADAS`).
- Cada entrada vira `EntradaLocal` otimista (`saving=true`) e é persistida via `ReleaseItemService.criar(releaseId, {... visibilidade:'TODOS'})`; `marcarEntradaSalva` ajusta `saved`/`error`.
- **Reordenação** (`onEntradaDrop`): `moveItemInArray` + `ReleaseItemService.reordenar(releaseId, ordens)` (ignora ids `local-*`; rollback ao estado anterior em erro).
- `removerEntrada` remove apenas do estado local.

## Passo 3 — encerrar (`encerrar()`)

`ReleaseService.alterarStatus(id, 'EM_REVISAO')` → navega para o detalhe (ou para a lista em erro).

## Componente filho

`RfBuilderTimelineComponent` (`app-rf-builder-timeline`): recebe `entradas` e `encerrando`; emite `removerEntrada`, `entradaDrop`, `encerrar`. Mapeia ícone Lucide por categoria.

## Estados de UI

- `criandoRelease`/`encerrando` controlam disabled/spinners.
- Salvamento por entrada com flags `saving | saved | error` (feedback inline).

## Dependências

`ReactiveFormsModule`, `RouterLink`, `LucideAngularModule`, `@angular/cdk/drag-drop`, `@shared/ui` (PageHeader, Button, Badge), `RfBuilderTimelineComponent`. Services: `ProdutoService`, `ReleaseService`, `ReleaseItemService`.

## Backend consumido

`POST /releases`, `PATCH /releases/{id}/status`, `POST /releases/{id}/itens`, `PUT /releases/{id}/itens/reordenar`, `GET /produtos`.

## Diferença para o Formulário

Builder = criação rápida + itens ao vivo (cria já em `EM_DESENVOLVIMENTO`). Formulário (`/releases/nova`) = cadastro completo com auto-save, sem itens.
