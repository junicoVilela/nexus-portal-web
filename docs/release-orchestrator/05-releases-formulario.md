# Tela: Formulário de Release (criar/editar)

## Identificação

- **Componente**: `ReleaseFormComponent` (`pages/releases/form/release-form.component.ts`)
- **Rotas**: `/release-orchestrator/releases/nova` e `/release-orchestrator/releases/:id/editar`
- **Guard**: `canDeactivateGuard` (implementa `CanDeactivateComponent`)

## Objetivo

Cadastro completo de release com auto-save de rascunho em `localStorage` e proteção contra saída com alterações não salvas.

## Form (`buildForm`)

| Campo | Validação |
|---|---|
| `produtoId` | obrigatório |
| `versao` | obrigatório, maxLength 20 |
| `titulo` | obrigatório, maxLength 200 |
| `tipo` | obrigatório (default `MINOR`) |
| `status` | **disabled** (default `RASCUNHO`) |
| `dataPrevista` | opcional |
| `responsavelId` | opcional |
| `resumo` | opcional |
| `observacoes` | opcional |

> Como `status` é disabled, o submit usa `form.getRawValue()`.

## Modos

- **Criar**: sem `:id` → restaura rascunho + ativa auto-save.
- **Editar**: com `:id` → `ReleaseService.buscarPorId` → `patchValue` → restaura rascunho + auto-save.

## Auto-save / rascunho

- Chave: `release-orchestrator:release-form:{id|'novo'}`.
- `inicializarAutoSave`: `valueChanges` com debounce `TIMINGS.autosaveDebounceMs` → grava `{value, at}` e `rascunhoSalvoEm`.
- `restaurarRascunho`: ignora se `idadeEmDias(at) > TIMINGS.draftMaxAgeDays`.
- `limparRascunho` ao salvar com sucesso.
- `hasUnsavedChanges()` = `dirty && !justSaved` (usado pelo guard).

## Ações

- `salvar()`: valida; `criar` ou `atualizar`; sucesso → limpa rascunho + navega para detalhe.
- `cancelar()`: volta para detalhe (editar) ou lista (novo).
- `fieldError(field)`: erro inline (invalid && touched).

## Dependências

`ReactiveFormsModule`, `DatePipe`, `@shared/ui` (PageHeader, Card, Button), `@shared/guards` (`CanDeactivateComponent`), `TIMINGS`, `idadeEmDias`. Services: `ProdutoService`, `ReleaseService`.

## Backend consumido

`POST /releases`, `PUT /releases/{id}`, `GET /releases/{id}`, `GET /produtos`.
