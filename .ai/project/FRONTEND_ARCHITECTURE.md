# Arquitetura Frontend

## Estrutura atual

```text
softon-portal-web/
├── frontend/               ← raiz da aplicação Angular
│   └── src/app/
│       ├── core/
│       │   ├── auth/
│       │   │   ├── guards/
│       │   │   │   ├── auth.guard.ts         ← protege rotas autenticadas → /login
│       │   │   │   └── guest.guard.ts        ← bloqueia /login se já autenticado
│       │   │   ├── interceptors/
│       │   │   │   └── auth.interceptor.ts   ← Bearer token + trata 401
│       │   │   ├── services/
│       │   │   │   └── auth.service.ts       ← login, logout, JWT, session
│       │   │   ├── pages/
│       │   │   │   └── login/                ← /login (público, guestGuard)
│       │   │   └── auth.routes.ts            ← AUTH_ROUTES (login)
│       │   ├── config/
│       │   │   ├── doc-flow-router.util.ts      ← prefixo /doc-flow
│       │   │   └── portal-modules.registry.ts   ← catálogo de módulos da home
│       │   └── layout/
│       │       └── shell/
│       │           └── app-shell.component.ts   ← sidebar global, topbar
│       │
│       ├── shared/
│       │   ├── components/
│       │   │   ├── audit-stamp/
│       │   │   └── table-pagination/
│       │   ├── models/
│       │   │   └── page-result.model.ts
│       │   └── utils/
│       │       ├── http-params.util.ts
│       │       ├── query-state.ts
│       │       └── pagination.ts
│       │
│       └── modules/
│           ├── dashboard/                ← HOME (cards de módulos)
│           │   ├── pages/home/
│           │   └── dashboard.routes.ts
│           │
│           ├── docflow/           ← DOC FLOW completo (shell próprio)
│           │   ├── shell/
│           │   ├── models/
│           │   ├── services/
│           │   ├── pages/
│           │   └── docflow.routes.ts
│           │
│           ├── release-orchestrator/             ← RELEASE FLOW (shell próprio)
│           │   ├── shell/
│           │   ├── models/
│           │   ├── services/
│           │   ├── pages/
│           │   └── release-orchestrator.routes.ts
│           │
│           └── administracao/            ← IDENTIDADE, ACESSO & CONFIGURAÇÕES
│               ├── shell/
│               ├── home/                 ← /administracao (visão geral)
│               ├── usuarios/
│               ├── grupos/
│               ├── permissoes/
│               ├── configuracoes/
│               ├── services/
│               │   ├── usuario.service.ts
│               │   ├── grupo.service.ts
│               │   ├── permissao.service.ts
│               │   └── configuracao.service.ts
│               ├── models/
│               │   ├── usuario.model.ts
│               │   ├── grupo.model.ts
│               │   └── permissao.model.ts
│               └── administracao.routes.ts
└── docker-compose.yml
```

## Core

- `core/auth/services/` — infraestrutura de autenticação global
- `core/auth/guards/` — authGuard e guestGuard
- `core/auth/interceptors/` — Bearer token, trata 401
- `core/auth/pages/login/` — página de login (pública)
- `core/config/portal-modules.registry.ts` — catálogo de módulos visíveis na home
- `core/config/doc-flow-router.util.ts` — helper que sempre prefixia `/doc-flow`
- `core/layout/shell/` — `AppShellComponent` (sidebar global + topbar). Cada módulo grande
  (doc-flow, release-orchestrator, administracao) tem seu próprio sub-shell dentro do módulo.

## Shared

- `shared/models/page-result.model.ts` — modelo genérico de paginação
- `shared/utils/http-params.util.ts` — `buildQueryParams()` para HttpParams
- `shared/utils/query-state.ts` — helpers de URL e parsing seguro
- `shared/utils/url-state.util.ts` — parsers tipados (`readUrlState`, `parseString`, `parseInt10`, `parseEnum`)
- `shared/utils/persisted-filters.ts` — `carregarFiltros()`/`salvarFiltros()` (localStorage + TTL)
- `shared/utils/filter-presets.ts` — presets nomeados (`listarPresets`, `salvarPreset`, ...)
- `shared/utils/error-classifier.ts` — classifica HttpErrorResponse em `ErrorVariant`
- `shared/utils/highlight.pipe.ts` — `<mark>` em match de busca
- `shared/components/` — componentes visuais utilitários (audit-stamp, table-pagination)
- `shared/ui/` — design system (28 componentes):
  - **Estrutura:** button, icon-button, card, badge, chip, breadcrumb, page-header, tabs,
    avatar, skeleton, tooltip
  - **Formulário:** input, select, checkbox, switch
  - **Feedback:** empty-state, error-state, toast, loading-bar, offline-banner,
    notification-center, install-prompt
  - **Sobreposições:** dialog (ConfirmDialog/Service), command-palette
  - **Padrões de dashboard / lista:** bulk-action-bar, status-pill-bar, kpi-card,
    filter-presets
- `shared/layouts/` — `list-page` e `form-page` (templates de página)
- `shared/guards/can-deactivate.guard.ts` — bloqueia navegação com alterações não salvas

## Módulos

| Módulo            | Responsabilidade                                                  | Rotas                          |
|-------------------|-------------------------------------------------------------------|--------------------------------|
| `dashboard`       | Home do portal com cards de acesso                                | `/`                            |
| `docflow`  | Manuais: clientes, projetos, módulos, páginas, publicações        | `/doc-flow/...`                |
| `release-orchestrator`    | Releases, changelog, templates, produtos                          | `/release-orchestrator/...`            |
| `administracao`   | Usuários, grupos, permissões e configurações                      | `/administracao/...`           |

## Routes exports

```typescript
AUTH_ROUTES              → login (para /login, fora do shell global)
DASHBOARD_ROUTES         → home (dentro do shell global)
DOCFLOW_ROUTES    → doc-flow (shell global + shell próprio)
RELEASE_ORCHESTRATOR_ROUTES       → release-orchestrator (shell global + shell próprio)
ADMINISTRACAO_ROUTES     → administracao (shell global + shell próprio,
                          inclui usuarios, grupos, permissoes, configuracoes)
```

## Rotas completas

```typescript
/login                          → AUTH_ROUTES                (guestGuard, sem shell)
/                               → DASHBOARD_ROUTES           (authGuard, shell global)
/doc-flow/...                   → DOCFLOW_ROUTES      (authGuard, shell global)
/release-orchestrator/...               → RELEASE_ORCHESTRATOR_ROUTES         (authGuard, shell global)
/administracao/...              → ADMINISTRACAO_ROUTES       (authGuard, shell global)
/administracao                  → Visão geral
/administracao/usuarios         → Usuários
/administracao/grupos           → Grupos
/administracao/permissoes       → Permissões
/administracao/configuracoes    → Configurações
```

Redirects de compatibilidade em `app.routes.ts`:

```typescript
/usuarios      → /administracao/usuarios
/configuracoes → /administracao/configuracoes
```

## Aliases TypeScript

```json
"@app/*"     → "src/app/*"
"@core/*"    → "src/app/core/*"
"@modules/*" → "src/app/modules/*"
"@shared/*"  → "src/app/shared/*"
"@env/*"     → "src/environments/*"
```

## Regras

- Components são `standalone: true` + `ChangeDetectionStrategy.OnPush` + `signal()`/`computed()`.
- Components não chamam HttpClient nem `fetch` — services fazem isso.
- Services retornam Observable (cache opcional via `shareReplay` + TTL).
- Models/interfaces tipam request/response da API.
- Sem imports cruzados entre módulos. Cada rota carrega componente do próprio módulo.
- Novos módulos: registrar em `core/config/portal-modules.registry.ts`.
- Novas rotas de gestão (usuários, grupos, permissões, configurações): entram em
  `modules/administracao/`.
- Lazy loading em todas as rotas de módulo.
- Bibliotecas pesadas (ngx-editor, marked, diff) ficam em chunks lazy via `@defer`
  ou `await import('lib')`.
- Toda nova lista deve usar `<ui-list-page>`; novo form deve usar `<ui-form-page>`.
- Erros HTTP em listas: usar `<ui-error-state>` com `classificarErro()` (utilitário).
- Estados vazios: usar `<ui-empty-state illustration="...">` com uma das 5 ilustrações SVG.
