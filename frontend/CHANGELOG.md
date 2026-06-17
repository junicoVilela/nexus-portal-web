# Changelog

Todas as mudanças notáveis do **frontend** ficam registradas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versões obedecem [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased] — Sessões 2026-06

Marco grande de modernização e amadurecimento do frontend. Mudanças
distribuídas em diversas rodadas (cleanup, P0/P1/P2, features, refactors).

### Métricas (snapshot final)

| Indicador                  | Valor                            |
| -------------------------- | -------------------------------- |
| Componentes em `shared/ui` | **28**                           |
| Sub-componentes de feature | **15+** (release-orchestrator + docflow) |
| Specs unitárias            | **67**                           |
| Testes verdes              | **327**                          |
| Stories Storybook          | **26**                           |
| Specs E2E (Playwright)     | **2** (smoke + a11y)             |
| Strings i18n marcadas      | **20**                           |
| LOC TS (sem specs/stories) | ~10 000                          |
| Lint warnings              | **0**                            |
| Build prod                 | OK, ~22s                         |
| Bundle inicial             | 584KB (151KB transfer)           |
| Vulnerabilidades npm audit | 15 (todas devDependencies)       |

---

### Arquitetura

- **Standalone components em 100%** dos arquivos, sem `NgModule`.
- **OnPush em 100%** dos componentes (exceção: `app.component` root).
- **Signals + computed** dominantes para estado reativo (98+ signals,
  24+ computeds). Sem `BehaviorSubject` para estado UI.
- **`input()`/`output()` em 100%** dos novos componentes — `@Input/@Output`
  decorator extintos.
- **Strict + strictTemplates** ligados em todo o build.
- **Tailwind v4 + design tokens** (159 vars CSS em `src/styles/tokens/`).
- **Lazy loading agressivo**: ngx-editor (`@defer`), marked (`import()`),
  diff (`import()`).
- **PWA** com `@angular/service-worker` 21.2 (`ngsw-config.json`,
  `manifest.webmanifest`, ícone SVG vetorial, estratégia
  `freshness` para `/produtos` e `/templates`).
- **View Transitions API** ativada no router
  (`withViewTransitions({ skipInitialTransition: true })`).
- **`prefers-reduced-motion: reduce`** neutraliza animações globalmente.
- **i18n com `@angular/localize`** configurado, `sourceLocale: 'pt-BR'`,
  20 trans-units extraídas em `src/locale/messages.xlf`.

### Design System (`shared/ui`)

Catálogo final com **28 componentes**:

**Estrutura:** `avatar`, `badge`, `breadcrumb`, `button`, `card`, `chip`,
`icon-button`, `page-header`, `skeleton`, `tabs`, `tooltip`.

**Formulário:** `checkbox`, `input`, `select`, `switch`.

**Feedback:** `empty-state`, `error-state`, `install-prompt`,
`loading-bar`, `notification-center`, `offline-banner`, `toast`.

**Sobreposições:** `command-palette`, `dialog` (ConfirmService).

**Listas / Dashboards:** `bulk-action-bar`, `filter-presets`, `kpi-card`,
`status-pill-bar`.

Cada componente tem **`.stories.ts`** no Storybook (24/28; faltam apenas
`toast` e `notification-center` que dependem de service global).

#### `<ui-empty-state>`

- Suporta `illustration: 'inbox' | 'search' | 'list' | 'success' | 'document' | 'none'`
- SVGs inline usando `var(--accent)` (adaptam ao dark mode).

#### `<ui-error-state>`

- 5 variants (`network`/`permission`/`notfound`/`server`/`generic`)
- Cada variant tem título/descrição/tom/ícone default.
- Strings via `$localize` (i18n-ready).
- Helper `classificarErro(err)` em `@shared/utils/error-classifier`
  converte `HttpErrorResponse` em `ErrorVariant`.

#### `<ui-notification-center>`

- Service signal-based (cap 50, persiste localStorage).
- `unreadCount` reativo, badge visual.
- Fontes plugadas:
  - `errorInterceptor` → 5xx (sticky + persistente)
  - `SwUpdate.versionUpdates` → "Nova versão disponível"
  - Publicar release → success com link
  - Aprovar/publicar página → success com link
  - Gerar publicação → success com nome do cliente

#### `<ui-install-prompt>` (PWA install banner)

- Captura `beforeinstallprompt`, persiste dispensa por 14 dias.
- Botão sutil no topbar, esconde automaticamente.

#### `<ui-filter-presets>`

- Salva/aplica/remove combinações nomeadas de filtros.
- Persiste em `localStorage` por escopo (`release-orchestrator:releases` etc.).
- Aplicado em `releases-list`.

#### `<ui-bulk-action-bar>`

- Barra "N selecionadas" com `<ng-content>` para ações arbitrárias.
- Singular/plural automático.
- Usado em `releases-list` (com Comparar / Cancelar / Excluir) e
  `paginas-list` (Arquivar).

#### `<ui-kpi-card>`

- 6 tones (`neutral`/`green`/`blue`/`amber`/`purple`/`red`),
  ícone Lucide opcional, descrição opcional.
- Aplicado em `rf-dashboard` (4 KPIs) e `dashboard` docflow (5 KPIs).

#### `<ui-status-pill-bar>`

- Genérico `<T extends string>`, com count por pill.
- Aplicado em `<paginas-filters>`.

### Features

- **Drag-and-drop hierárquico** com `@angular/cdk/drag-drop`:
  - Reordenação no `release-builder` (`<rf-builder-timeline>`) — com
    **rollback otimista** em caso de erro do backend.
  - Reordenação no `release-detalhe` por categoria.
- **Diff word-level** entre revisões de página:
  - Lib `diff` 9.0 carregada via `await import('diff')` (lazy 54KB).
  - `diffPalavras()` e `diffLinhasPalavras()` em
    `@modules/docflow/utils/diff.util`.
  - `<pagina-revisoes>` render usa `<mark>` com `--add`/`--rem`.
- **Bulk actions** em listas:
  - `releases-list`: Comparar (quando 2 selecionadas), Cancelar, Excluir
    — todos com `ConfirmService.confirm()`.
  - `paginas-list`: Arquivar em lote com confirm.
- **Comparar 2 releases lado-a-lado** (`<app-release-compare>`):
  - Modal full-screen, 2 colunas, itens agrupados por categoria,
    `forkJoin` de 4 requisições.
- **Filtros avançados na lista de releases**:
  - Período (data prevista / publicação) com toggle "Mostrar período".
  - Busca com debounce 300ms.
  - Contador "Limpar (N)" só quando há filtros ativos.
  - Filtros persistidos em `localStorage`.
- **Search global** (`busca-global`):
  - Tabs por tipo (Todos / Clientes / Projetos / Módulos / Páginas /
    Publicações) com contagem.
  - Highlight de match via `HighlightPipe` (`| highlight: termo`).
- **Theme picker** (acento):
  - 5 presets (`blue`/`purple`/`green`/`rose`/`amber`).
  - Cada preset tem valor para light/dark mode.
  - Acessível via command palette (`Acento: Azul`, ...).
  - Persiste em `localStorage['portal-accent']`.
- **Command palette** (`Cmd/Ctrl+K` ou `/`):
  - Navegação, tema, presets de acento, logout.
  - Namespaces (`shell`, `legacy`) para registro descoberto.
- **PDF download** de release (`ReleasePdfService`) — gera blob, faz
  click programático, revoga URL.
- **Timeline visual** no histórico de release (`<app-historico-timeline>`):
  - Dots circulares coloridos por tom (success/warn/danger/info/neutral).
  - Ícones Lucide mapeados (`ACAO_HISTORICO_ICONES_LUCIDE`).

### Refactors

#### Extraídos como sub-componentes

| Origem                             | Sub-componente                                                                                                                        | LOC pai antes → depois     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `release-detalhe`                  | `<app-historico-timeline>`                                                                                                            | 1220 → 1088 (-11%)         |
| `release-builder`                  | `<app-rf-builder-timeline>`                                                                                                           | 1463 → 1055 (-28%)         |
| `pagina-form`                      | `<app-pagina-rich-editor>`, `<app-pagina-revisoes>`, `<app-pagina-anexos>`, `<app-pagina-editor-toolbar>`, `<app-pagina-meta-fields>` | 1538 → 1170 (-24%)         |
| `paginas-list`                     | `<app-paginas-filters>`                                                                                                               | 920 → 787 (-14%)           |
| `busca-global`                     | `<app-busca-result-list>` (reuso 4×)                                                                                                  | ~745 → 648 (-13%)          |
| `releases-list` (compartilhamento) | `<ui-bulk-action-bar>`                                                                                                                | ~25 LOC duplicado removido |

#### Decisão consciente de NÃO refatorar

- **`clientes-list` (vínculos panel)** — 282 LOC acoplados a 10+ signals
  do pai. Registrado em `FRONTEND_STANDARDS.md`. Risco > ganho.

#### Outros refactors

- Eliminado `migrateLegacySessionKeys` no `AuthService` (lixo herdado).
- Removido `@storybook/addon-onboarding` (peso morto após init).
- Migração `manual-usuario` → `docflow` consolidada.
- Status naming alinhado com backend, decisão documentada.

### Testes

#### Cobertura por módulo (specs por arquivo TS, sem stories)

| Módulo                   | Specs | TS files |
| ------------------------ | ----- | -------- |
| `core/auth/`             | 4     | 6        |
| `core/http/`             | 2     | 2        |
| `core/layout/`           | 1     | 1        |
| `core/theme/`            | 1     | 1        |
| `shared/ui/`             | 26    | 52       |
| `shared/utils/`          | 8     | 7        |
| `shared/guards/`         | 1     | 2        |
| `shared/layouts/`        | 2     | 2        |
| `modules/docflow/`       | 10    | 36+      |
| `modules/release-orchestrator/`  | 8     | 27+      |
| `modules/administracao/` | 5     | 14       |
| `modules/dashboard/`     | 1     | 2        |

#### Specs HTTP services (100% cobertura de services)

- Release Orchestrator: `release`, `release-item`, `release-template`, `produto`,
  `release-pdf` — todos testados (paging, sort, error fallbacks, cache).
- Docflow: `cliente`, `projeto`, `modulo`, `pagina`, `publicacao` — idem.
- Administração: `usuario`, `grupo`, `permissao`, `configuracao`.

#### Specs de interceptors e guards

- `authInterceptor`: Bearer header, 401 com token válido (não desloga),
  401 com token expirado (desloga), 5xx rethrow.
- `errorInterceptor`: toast por status, sticky em 5xx, silencia
  0/401/`X-Silent-Error`, notif persistente em 5xx.
- `loadingInterceptor`: start/end em sucesso, end em erro,
  `X-Silent-Loading`.
- `authGuard`, `guestGuard`, `canDeactivateGuard` — todos testados.

#### Specs de utils

- `error-classifier`, `persisted-filters`, `query-state`, `http-params`,
  `diff.util`, `filter-presets`, `url-state.util`, `highlight.pipe`.

#### Smoke tests de forms críticos

- `cliente-form`, `release-form`, `pagina-form`, `publicacao-form`,
  `usuarios.component` — render + form inválido/válido.

#### E2E com Playwright (sem backend)

- Setup completo com `playwright.config.ts` e `webServer` automático.
- `e2e/smoke.spec.ts`: redirect `/`→`/login`, login renderiza, manifest,
  title.
- `e2e/a11y.spec.ts`: WCAG A/AA em `/login` via `@axe-core/playwright`.
- **Storybook test-runner** instalado (`npm run test-storybook`).

#### Helper compartilhado

- `src/testing/lucide-test-icons.ts` registra 73 ícones Lucide para uso
  uniforme entre todas as specs.

### DevX

- **Storybook 10.4** com `addon-a11y`, `addon-docs`, alias `@sb/*` para
  `.storybook/`.
- **`npm run analyze`** com `source-map-explorer`.
- **`npm run extract-i18n`** para regenerar `messages.xlf`.
- **`npm run e2e`** para Playwright local.
- **`npm run test-storybook`** para smoke das stories.
- **Husky + lint-staged** em pre-commit (eslint --fix + prettier).
- **Budgets de bundle** apertados em `angular.json`:
  - `initial` ≤ 700KB / 1.0MB
  - `docflow-routes` ≤ 260KB / 400KB
  - `release-orchestrator-routes` ≤ 300KB / 450KB
  - `administracao-routes` ≤ 80KB / 150KB
  - `anyComponentStyle` ≤ 16KB / 24KB

### Documentação

- **`README.md` do `frontend/`** com scripts, estrutura, aliases, PWA,
  proxy, convenções, troubleshooting, baseline de bundle.
- **`CHANGELOG.md`** (este arquivo).
- **`.ai/project/PROJECT_CONTEXT.md`** atualizado com stack atual.
- **`.ai/project/FRONTEND_ARCHITECTURE.md`** com inventário completo de
  `shared/ui` por categoria e nova lista de `shared/utils`.
- **`.ai/project/FRONTEND_STANDARDS.md`** com:
  - Naming de Status/Enums.
  - Regras de extração (quando NÃO criar sub-componente).
  - Decisão registrada sobre `clientes-list`.
  - Padrão de error/toast/notification.
  - i18n e helpers.

### Dependências

#### Adicionadas

- `@angular/localize` 21.2
- `@angular/service-worker` 21.2
- `diff` 9.0 + `@types/diff` 7.0
- `@angular/cdk` (atualizado)
- `@compodoc/compodoc` 1.2 (via Storybook)
- `@playwright/test` 1.60
- `@axe-core/playwright` (latest)
- `@storybook/test-runner`
- `source-map-explorer`

#### Bump de patches (em massa)

- `@angular/*` 21.2.10 → 21.2.17
- `@angular/cli` 21.2.10 → 21.2.15
- `@angular-devkit/build-angular` → 21.2.15
- `eslint` 10.4 → 10.5
- `tailwindcss` + `@tailwindcss/postcss` → 4.3.1

#### Vulnerabilidades

- `npm audit fix` (sem `--force`): 30 → 15.
- Restantes são todas em `webpack-dev-server`/`sockjs` (dev only).

### Decisões não aplicadas (intencional)

- **CI (GitHub Actions)** — pulado pelo usuário.
- **Backend / mock server (MSW)** — pulado.
- **Refactor de `clientes-list`** — risco > ganho, documentado.
- **i18n de páginas inteiras** — só `shared/ui` strings de UI marcadas.
- **`useUrlState` em componentes com persisted-filters** — não aplicado
  porque mesclar URL + localStorage + default escapa do schema simples.
  Aplicado apenas em `dashboard` (caso URL-only puro).

---

## Histórico anterior

Sem commits formais antes desta janela. Estado pré-modernização era
documentado em `.ai/project/PROJECT_CONTEXT.md` original (Angular 21,
PrimeNG removido, componentes próprios em `shared/ui` parciais,
~10 specs apenas, sem PWA, sem i18n, sem Storybook).
