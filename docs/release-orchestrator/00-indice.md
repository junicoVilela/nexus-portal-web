# Telas do módulo Release Orchestrator (Frontend)

Documentação **uma tela por arquivo** do módulo `nexus-portal-web/frontend/src/app/modules/release-orchestrator/`. Foco frontend. Para a API consumida (modelo de dados, endpoints, regras), ver a doc do backend em [`nexus-portal-api/docs/release-orchestrator/`](../../../nexus-portal-api/docs/release-orchestrator/README.md).

**Jornadas de uso** (fluxo end-to-end, GitHub/Jenkins): [`nexus-portal-api/docs/jornadas/`](../../../nexus-portal-api/docs/jornadas/README.md).

## Stack

- Angular standalone components + Signals + `ChangeDetectionStrategy.OnPush`
- Reactive Forms / `FormsModule`
- RxJS 7
- `lucide-angular` (ícones)
- Componentes próprios em `@shared/ui` e layouts em `@shared/layouts`
- `@angular/cdk/drag-drop` (reordenação)
- Base da API: `environment.releaseOrchestratorApiUrl` = `/api/v1/release-orchestrator`

## Mapa de rotas (`release-orchestrator.routes.ts`)

| Rota | Componente | Tela | Arquivo |
|---|---|---|---|
| `/release-orchestrator` | `RfDashboardComponent` | Dashboard | [02](02-dashboard.md) |
| `/release-orchestrator/builder` | `ReleaseBuilderComponent` | Registrar (builder) | [03](03-builder-registrar.md) |
| `/release-orchestrator/releases` | `ReleasesListComponent` | Lista de releases | [04](04-releases-lista.md) |
| `/release-orchestrator/releases/nova` | `ReleaseFormComponent` | Formulário (criar) | [05](05-releases-formulario.md) |
| `/release-orchestrator/releases/:id/editar` | `ReleaseFormComponent` | Formulário (editar) | [05](05-releases-formulario.md) |
| `/release-orchestrator/releases/:id` | `ReleaseDetalheComponent` | Detalhe | [06](06-releases-detalhe.md) |
| `/release-orchestrator/releases/:id/revisao` | `ReleaseRevisaoComponent` | Revisão | [07](07-releases-revisao.md) |
| `/release-orchestrator/produtos` | `RfProdutosComponent` | Produtos | [08](08-produtos.md) |
| `/release-orchestrator/templates` | `RfTemplatesComponent` | Templates | [09](09-templates.md) |
| `/release-orchestrator/guia` | `RfGuiaComponent` | Guia | [10](10-guia.md) |

- Guards: `canDeactivateGuard` em `nova` e `:id/editar`.
- Resolver: `releaseResolver` em `:id` e `:id/revisao` (pré-carrega a release).
- Tudo aninhado sob `ReleaseOrchestratorShellComponent` (ver [01](01-shell-navegacao.md)).

## Camadas do módulo

- **models/**: `release`, `release-item`, `produto`, `release-template`, `release-historico`, `guia-passo`.
- **services/**: `release.service`, `release-item.service`, `produto.service`, `release-template.service`, `release-pdf.service`.
- **components/**: `release-status-badge`, `release-compare`, `historico-timeline`, `rf-builder-timeline`.
- **resolvers/**: `release.resolver`.

## Enums e labels (models)

- `ReleaseStatus`: RASCUNHO, EM_DESENVOLVIMENTO, EM_REVISAO, APROVADA, PUBLICADA, CANCELADA.
- `TipoRelease`: MAJOR, MINOR, PATCH, HOTFIX, FEATURE.
- `CategoriaItem`: NOVIDADE, MELHORIA, CORRECAO, SEGURANCA, PERFORMANCE, DOCUMENTACAO, AJUSTE_TECNICO, IMPACTO_OPERACIONAL, IMPORTANTE.
- `VisibilidadeItem`: TODOS, TECNICO, SUPORTE.
- `AcaoHistorico`: CRIADA, EDITADA, ITEM_ADICIONADO/EDITADO/REMOVIDO, ENVIADA_REVISAO, APROVADA, PUBLICADA, CANCELADA, REABERTA, DUPLICADA, PDF_GERADO, ENVIADA_CLIENTE.

## Fluxo de status (`RELEASE_STATUS_FLOW`)

- RASCUNHO → EM_DESENVOLVIMENTO / CANCELADA
- EM_DESENVOLVIMENTO → EM_REVISAO / CANCELADA
- EM_REVISAO → APROVADA / RASCUNHO / CANCELADA
- APROVADA → PUBLICADA / EM_REVISAO / CANCELADA
- `podeEditar(status)` = true para RASCUNHO e EM_DESENVOLVIMENTO.

## Rotas futuras (Fase 1 — entregas)

Não existem no código ainda. Mapa completo em [11-indice-entregas-orchestrator.md](11-indice-entregas-orchestrator.md) e specs API `02`–`28` em [`nexus-portal-api/docs/release-orchestrator/`](../../../nexus-portal-api/docs/release-orchestrator/README.md).

CI/CD nos repositórios de produto (Jenkinsfile, tags): specs API [`39`](../../../nexus-portal-api/docs/release-orchestrator/39-entregaveis-cicd-repositorios.md) e [`40`](../../../nexus-portal-api/docs/release-orchestrator/40-guia-versao-tag.md). Resumo narrativo: [`jornadas/01-github-jenkins-delta`](../../../nexus-portal-api/docs/jornadas/01-github-jenkins-delta.md).
