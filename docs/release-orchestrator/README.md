# Release Orchestrator — Documentação Frontend (por tela)

Documentação do módulo **Release Orchestrator** do `softon-portal-web`, organizada **uma tela por arquivo**.

- **Código**: `softon-portal-web/frontend/src/app/modules/release-orchestrator/`
- **Backend (API, modelo, regras)**: [`softon-portal-api/docs/release-orchestrator/`](../../../softon-portal-api/docs/release-orchestrator/README.md) — referência única do backend.

## Escopo desta pasta

| Domínio | Arquivos | Estado |
|---|---|---|
| **Gestão de releases** (implementado) | `00`–`10` | ✅ alinhado ao código |
| **Entregas a clientes** (Fase 1) | [`11-indice-entregas-orchestrator.md`](11-indice-entregas-orchestrator.md) | 📋 índice + stubs → specs API |
| **CI/CD nos repos** | specs API `39`, `40` | 🔧 fora do frontend |

## Como ler

1. Comece pelo [índice](00-indice.md) para o mapa de rotas, camadas e enums.
2. Cada tela tem seu próprio arquivo: objetivo, layout, estado (signals), fluxos/ações, formulários, estados de UI, dependências e a API consumida.

## Índice das telas

| # | Tela | Rota | Arquivo |
|---|---|---|---|
| 00 | Índice (rotas, camadas, enums) | — | [00-indice.md](00-indice.md) |
| 01 | Shell / Navegação | `path: ''` | [01-shell-navegacao.md](01-shell-navegacao.md) |
| 02 | Dashboard | `/release-orchestrator` | [02-dashboard.md](02-dashboard.md) |
| 03 | Registrar (Builder) | `/release-orchestrator/builder` | [03-builder-registrar.md](03-builder-registrar.md) |
| 04 | Lista de Releases | `/release-orchestrator/releases` | [04-releases-lista.md](04-releases-lista.md) |
| 05 | Formulário de Release | `/releases/nova` · `/releases/:id/editar` | [05-releases-formulario.md](05-releases-formulario.md) |
| 06 | Detalhe da Release | `/releases/:id` | [06-releases-detalhe.md](06-releases-detalhe.md) |
| 07 | Revisão da Release | `/releases/:id/revisao` | [07-releases-revisao.md](07-releases-revisao.md) |
| 08 | Produtos | `/release-orchestrator/produtos` | [08-produtos.md](08-produtos.md) |
| 09 | Templates | `/release-orchestrator/templates` | [09-templates.md](09-templates.md) |
| 10 | Guia (Como usar) | `/release-orchestrator/guia` | [10-guia.md](10-guia.md) |

### Fase 1 — Entregas (a implementar)

| # | Conteúdo | Arquivo |
|---|---|---|
| 11 | Índice de telas + mapa para specs API | [11-indice-entregas-orchestrator.md](11-indice-entregas-orchestrator.md) |

Specs detalhadas de cada tela futura permanecem em [`softon-portal-api/docs/release-orchestrator/`](../../../softon-portal-api/docs/release-orchestrator/README.md) (`02`–`28`). Novos arquivos `12+` nesta pasta serão criados conforme as telas forem implementadas.

## Stack

Angular standalone + Signals + `OnPush`, Reactive Forms, RxJS 7, `lucide-angular`, componentes `@shared/ui`, `@angular/cdk/drag-drop`. Base da API: `/api/v1/release-orchestrator` (`environment.releaseOrchestratorApiUrl`).

## Drift conhecido (front × back)

- **PDF**: o front chama `GET /releases/{id}/pdf?tipo=` mas o endpoint **não existe** no backend atual (planejado — ver `25-documento-release-md-pdf.md` do api).
- **Filtros de data** na lista de releases: enviados pelo front, **não aceitos** pelo `GET /releases`.
- **Permissões**: menu do front filtra por `RECURSO:ACAO` (ex.: `RELEASE:CRIAR`); o back protege por role `ADMIN`/`EDITOR`.
- **Upload de logo de produto**: `ProdutoService.uploadLogo` aponta para `/produtos/{id}/logo`, sem controller correspondente.

## Documentação relacionada

- [`softon-portal-api/docs/release-orchestrator/`](../../../softon-portal-api/docs/release-orchestrator/README.md) — **referência única do backend** (clientes, entregas, delta, pacote, GitHub/Jenkins, MD→PDF, modelo de dados, OpenAPI, testes, deploy).
- [`softon-portal-api/docs/jornadas/`](../../../softon-portal-api/docs/jornadas/README.md) — Jornadas de uso (c cenário ACME, GitHub/Jenkins/delta).
- [`39-entregaveis-cicd-repositorios.md`](../../../softon-portal-api/docs/release-orchestrator/39-entregaveis-cicd-repositorios.md) — Jenkinsfile e assets nos repos de produto.
- [`40-guia-versao-tag.md`](../../../softon-portal-api/docs/release-orchestrator/40-guia-versao-tag.md) — versionamento e tags.
- [`softon-portal-api/docs/ROADMAP.md`](../../../softon-portal-api/docs/ROADMAP.md) — roadmap consolidado.

> **Histórico**: esta doc substitui as antigas specs por camada (00-08, 99), que estavam desatualizadas (nomes `Rh*`/`Hub*`, DnD/PDF/bulk como "futuros"). O conteúdo antigo permanece recuperável pelo histórico do git.
