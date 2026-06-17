# Tela: Dashboard

## Identificação

- **Componente**: `RfDashboardComponent` (`pages/dashboard/rf-dashboard.component.ts`)
- **Rota**: `/release-orchestrator`
- **Seletor**: `app-rf-dashboard`

## Objetivo

Visão geral: 4 KPIs por status + tabela de releases recentes + card placeholder de "últimas atividades".

## Layout

- `ui-page-header` "Dashboard" com ações: **Como usar** (ghost), **Ver todas** (secondary), **Registrar release** (primary).
- `ui-error-state` condicional (quando `erro()`).
- Grid de `ui-kpi-card` (4 indicadores).
- Card "Releases recentes" (tabela) + Card "Últimas atividades" (placeholder estático).

## Estado (signals)

| Signal | Tipo | Uso |
|---|---|---|
| `loading` | `boolean` | skeleton da tabela |
| `erro` | `string \| null` | mensagem de erro |
| `erroVariant` | `ErrorVariant` | classificação via `classificarErro` |
| `releasesRecentes` | `Release[]` | linhas da tabela |
| `indicadores` | `Indicador[]` | KPIs (label, valor, icon, cor) |

## Carregamento de dados (`carregar()`)

`forkJoin` de 4 chamadas a `ReleaseService.listar()`:

- `recentes`: `page:1, size:8, sort:'updatedAt', direction:'DESC'` → linhas + KPI "Itens registrados" (usa `totalItems`).
- `publicadas`: `status:'PUBLICADA', size:1` → KPI "Releases publicadas" (usa `totalItems`).
- `emRevisao`: `status:'EM_REVISAO', size:1` → KPI "Em revisão".
- `emDesenvolvimento`: `status:'EM_DESENVOLVIMENTO', size:1` → KPI "Em desenvolvimento".

> Os contadores vêm do `totalItems` da paginação (não há endpoint dedicado de stats).

## KPIs

| Label | Ícone | Tom (`KpiTone`) |
|---|---|---|
| Releases publicadas | `CheckCircle` | `green` |
| Em revisão | `Clock` | `amber` |
| Em desenvolvimento | `Code` | `blue` |
| Itens registrados | `List` | `purple` |

## Tabela "Releases recentes"

- Colunas: Produto (badge com `produtoCor`/`produtoSigla`), Versão (mono), Título, Status (`ui-badge` + `getStatusTone`), Tipo, Data (`dataPublicacao || dataPrevista || createdAt`, `dd/MM/yy`), seta.
- Linha clicável → `/release-orchestrator/releases/:id`.

## Estados de UI

- **Loading**: 3 `ui-skeleton`.
- **Vazio**: `ui-empty-state` (ilustração `inbox`) com botão "Criar primeira release".
- **Erro**: `ui-error-state` com retry → `carregar()`.

## Dependências

`@shared/ui`: PageHeader, Card, Button, Badge, EmptyState, ErrorState, Skeleton, KpiCard. `DatePipe`, `RouterLink`, `LucideAngularModule`.

## Backend consumido

`GET /releases` (paginação/filtros). Ver a doc do backend em [`softon-portal-api/docs/release-orchestrator/`](../../../softon-portal-api/docs/release-orchestrator/README.md).

## Observações

- Card "Últimas atividades" é **placeholder** (texto fixo), sem dados reais.
- `getStatusTone` mapeia status → `success | warn | danger | neutral`.
