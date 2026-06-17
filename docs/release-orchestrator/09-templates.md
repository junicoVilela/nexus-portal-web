# Tela: Templates

## Identificação

- **Componente**: `RfTemplatesComponent` (`pages/templates/rf-templates.component.ts`)
- **Rota**: `/release-orchestrator/templates`
- **Permissão de menu**: `TEMPLATE:LER`

## Objetivo

CRUD de templates de release com **editor Markdown** (toolbar + preview ao vivo).

## Estado (signals)

`loading`, `salvando`, `erro`, `erroVariant`, `templates`, `page`(1), `totalItems`, `pageSize`(20), `showForm`, `editId`, `excluindoId`, `showPreview`(true), `estruturaPreviewHtml` (`SafeHtml`).

## Form (`buildForm`)

| Campo | Validação |
|---|---|
| `nome` | obrigatório, maxLength 100 |
| `descricao` | opcional |
| `tipoRelease` | opcional (enum `TipoRelease`) |
| `produtoId` | opcional |
| `estrutura` | obrigatório (Markdown) |
| `ativo` | default `true` |

## Editor Markdown

- `mdToolbar`: H1, H2, H3, Bold, Itálico, Código, Lista, Link (`aplicarMd` insere `before/after` na seleção do textarea).
- Preview: import dinâmico de `marked`; `atualizarPreview()` em `valueChanges` de `estrutura`; HTML sanitizado via `DomSanitizer.bypassSecurityTrustHtml`.
- `togglePreview()` mostra/oculta.

## Ações

`abrirNovo`, `editar(t)`, `salvar()` (criar/atualizar → recarrega lista), `excluir(t)`, `toggleAtivo(t)`.

## Estados de UI

`SkeletonComponent`, `EmptyStateComponent`, `ErrorStateComponent`.

## Backend consumido

`GET /templates`, `POST /templates`, `PUT /templates/{id}`, `PATCH /templates/{id}/status`, `DELETE /templates/{id}`.

## Observações

- O preview usa `bypassSecurityTrustHtml` em conteúdo renderizado de Markdown editável — risco de XSS a avaliar (sanitização real recomendada).
