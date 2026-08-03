# Nexus Portal Web — Frontend

Frontend Angular 21+ do portal interno corporativo da Nexus.

## Stack

- **Angular 21+** com standalone components + signals + OnPush (100% dos componentes)
- **TypeScript** (strict + `strictTemplates`)
- **Tailwind v4** + design tokens em `src/styles/tokens/`
- **lucide-angular** para ícones
- **ngx-editor**, **marked**, **diff** (todos lazy-loaded)
- **@angular/cdk/dialog** e `drag-drop`
- **PWA** via `@angular/service-worker`
- **Karma + Jasmine** (testes unitários) — 200+ specs
- **Storybook 10** + addon-a11y / addon-docs
- ESLint + Prettier + Husky + lint-staged

## Pré-requisitos

- Node 20+ e npm 10+
- Backend `nexus-portal-api` rodando em `http://localhost:8080` (ou ajustar `proxy.conf.json`).

## Executar no IntelliJ

O frontend não é executado via Docker Compose. Com o backend iniciado pelo IntelliJ,
execute o script npm `start` a partir da pasta `frontend` (pela janela **npm** do
IntelliJ ou com `npm start` no terminal). A aplicação ficará disponível em
`http://localhost:4200` e o proxy local encaminhará as chamadas de API para
`http://localhost:8080`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm install --legacy-peer-deps` | Instala dependências |
| `npm start` | Dev server em `http://localhost:4200` com proxy para `/api/...` |
| `npm run build` | Build de produção em `dist/nexus-portal-web/browser/` |
| `npm test` | Testes unitários (single-run, ChromeHeadless) |
| `npm run lint` | ESLint em `src/**/*.{ts,html}` |
| `npm run lint:fix` | ESLint com auto-fix |
| `npm run format` | Prettier sobre `src/**/*.{ts,html,css,scss,json}` |
| `npm run format:check` | Prettier modo check (CI-friendly) |
| `npm run storybook` | Storybook em `http://localhost:6006` |
| `npm run build-storybook` | Storybook estático em `storybook-static/` |
| `npm run extract-i18n` | Extrai strings marcadas com `i18n` para `src/locale/messages.xlf` |

> **Por que `--legacy-peer-deps`?** Storybook 10 + Angular 21 declaram peers que o
> npm 10 considera incompatíveis (apesar de funcionarem). É só durante o install.

## Estrutura

```text
frontend/src/app/
├── core/                        # Auth, layout, configuração e interceptors globais
│   ├── auth/                    # AuthService, authGuard, guestGuard, authInterceptor
│   ├── config/                  # portal-modules.registry, helpers de rotas
│   ├── http/interceptors/       # loadingInterceptor, errorInterceptor
│   └── layout/shell/            # AppShellComponent (sidebar + topbar)
├── shared/
│   ├── components/              # audit-stamp, table-pagination
│   ├── guards/                  # canDeactivateGuard
│   ├── layouts/                 # list-page, form-page (templates de página)
│   ├── models/                  # page-result.model
│   ├── ui/                      # Design system (button, card, badge, …)
│   └── utils/                   # http-params, query-state, persisted-filters,
│                                # error-classifier
└── modules/
    ├── dashboard/               # Home
    ├── docflow/                 # Manuais (clientes, projetos, módulos, páginas,
    │                            #          publicações)
    ├── release-orchestrator/            # Releases, builder, produtos, templates
    └── administracao/           # Usuários, grupos, permissões, configurações
```

Aliases de paths (em `tsconfig.json`):

| Alias | Aponta para |
|---|---|
| `@app/*` | `src/app/*` |
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@modules/*` | `src/app/modules/*` |
| `@env/*` | `src/environments/*` |

## Padrões

Documentação consolidada em `../.ai/`:

- `.ai/project/PROJECT_CONTEXT.md` — visão geral, módulos e features
- `.ai/project/FRONTEND_ARCHITECTURE.md` — estrutura de pastas, rotas, regras
- `.ai/project/FRONTEND_STANDARDS.md` — nomenclatura, components, services, forms
- `.ai/project/UI_UX_STANDARDS.md` — layouts, tabelas, formulários, mensagens
- `.ai/project/API_INTEGRATION.md` — prefixos API, services, autenticação JWT

Specs por módulo: `.ai/modules/*.md`.

## PWA / Service Worker

- Manifest em `src/manifest.webmanifest`, ícone em `src/assets/icons/icon.svg`
- Configuração de cache em `ngsw-config.json`
- Service worker é registrado apenas em build de **produção** (`provideServiceWorker` com `enabled: !isDevMode()`)
- Para testar localmente: `npm run build` + `npx http-server dist/nexus-portal-web/browser`

## Bundle (referência)

Baseline atual em build de produção (2026-06):

| Chunk | Tamanho | Conteúdo principal |
|---|---|---|
| `index` (lazy) | 301KB | ngx-editor + prosemirror (carrega só ao abrir editor de página) |
| vendor (initial) | 290KB | Angular core/forms/common — inevitável |
| `release-orchestrator-routes` (lazy) | 239KB | Páginas + @angular/cdk/drag-drop (~55KB) |
| shell (initial) | 218KB | Router + cdk overlay + lucide + ConfirmDialog |
| `docflow-routes` (lazy) | 202KB | Páginas do docflow |
| `marked` (lazy) | 42KB | Markdown render |
| `diff` (lazy) | 54KB | Diff word-level |

Rodar `npm run analyze` regenera o HTML interativo. Quaisquer regressões > 10% devem ser investigadas.

## Backend / proxy

- Doc Flow / Auth / Usuários / Configurações: prefixo `/api/doc-flow`
- Release Orchestrator: prefixo `/api/v1/release-orchestrator`
- `proxy.conf.json` redireciona ambos para `http://localhost:8080`
- JWT em `localStorage['doc-flow-jwt']`; `authInterceptor` injeta o Bearer

## Convenções essenciais

- Components **standalone** + **OnPush** + **signals**. Nunca usar `@Input/@Output` decorators — usar `input()` e `output()`.
- Services fazem comunicação HTTP; components nunca chamam `HttpClient` diretamente.
- Páginas de lista usam `<ui-list-page>`; páginas de form usam `<ui-form-page>`.
- Erros em lista: `<ui-error-state>` + `classificarErro(err)`.
- Estados vazios: `<ui-empty-state illustration="...">` (inbox, search, list, success, document).
- Toasts: `inject(ToastService).error('mensagem')`.
- Notificações persistentes (drawer): `inject(NotificationService).add('success', titulo, { description, href })`.
- Confirmação destrutiva: `await inject(ConfirmService).confirm({ title, message, variant: 'danger', icon: 'Trash2' })`.
- Diff de revisões: usar `diffLinhasPalavras()` em `@modules/docflow/utils/diff.util` (lazy).
- Bulk actions: `<ui-bulk-action-bar [count]="N">…<ng-content>…</ui-bulk-action-bar>`.
- KPIs em dashboards: `<ui-kpi-card label valor icon tone description?>`.
- Barras de filtro por status: `<ui-status-pill-bar [items] [value] (selecionar)>`.
- Filtro avançado salvável: `<ui-filter-presets escopo="…" [filtrosAtuais] [filtrosAtivos] (presetSelecionado)>`.
- Highlight de match em busca: pipe `| highlight: termo` (em `@shared/utils/highlight.pipe`).
- URL state ↔ filtros: usar `readUrlState(params, schema)` e `compactQueryParams(state)` em conjunto.
- Cada componente novo de `shared/ui` deve ter `*.stories.ts` no Storybook e `*.spec.ts`.
- Toda função pública nova de service / util deve ter spec.

## Troubleshooting

- **Build estoura budget de um componente CSS**: o componente está com CSS gigante — quebrar em sub-componentes (ver `pagina-form` como referência).
- **Testes não rodam**: confira se Chrome está disponível (`google-chrome` ou `chromium`). Karma usa `ChromeHeadless`.
- **Storybook reclama de peers**: rode `npm install --legacy-peer-deps`.
