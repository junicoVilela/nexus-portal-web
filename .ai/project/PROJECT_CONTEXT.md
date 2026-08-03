# Contexto Geral do Frontend

## Nome do projeto

Nexus Portal Web

## Objetivo

Frontend web do portal interno corporativo da Nexus.

Portal unificado: login próprio, home com cards de acesso, e módulos independentes por feature.

## Localização da aplicação Angular

```text
nexus-portal-web/frontend/   ← raiz do projeto Angular
```

## Framework

Angular 21+ com **standalone components**, **signals** + **OnPush** em 100% dos componentes,
**lazy loading** por rota de módulo, **PWA** via `@angular/service-worker`.

Stack:
- Tailwind v4 + CSS custom properties (design tokens em `src/styles/tokens/`)
- lucide-angular para ícones (registrados em `app.config.ts`)
- ngx-editor (rich editor, lazy-loaded via `@defer`)
- marked (markdown, dynamic import)
- diff (word-level, dynamic import)
- @angular/cdk/dialog + drag-drop
- ESLint + Prettier + Husky + lint-staged
- Karma + Jasmine (testes unitários) — 200+ specs
- Storybook 10 para `shared/ui` (19 stories, addon-a11y, addon-docs)

## Estilo arquitetural

Frontend modular por módulo de negócio.

```text
frontend/src/app/
├── core/
├── shared/
└── modules/
    ├── dashboard/        ← home
    ├── docflow/          ← Doc Flow (manuais)
    ├── release-orchestrator/     ← Release Orchestrator
    └── administracao/    ← usuarios, grupos, permissoes, configuracoes
```

## Objetivo visual

Interface corporativa, limpa, responsiva e objetiva.

- sidebar global colapsável escura
- topbar com título dinâmico
- home com cards de módulos
- tela de login com design split (aside + formulário)
- cada módulo grande tem seu próprio sub-shell com navegação interna

## Backend

```text
nexus-portal-api
```

Prefixos:

```text
/api/doc-flow      ← Doc Flow (manuais), Auth, Usuários, Configurações
/api/v1/release-orchestrator ← Release Orchestrator
```

Autenticação: `POST /api/doc-flow/auth/login`

## Features implementadas

| Feature           | Rota                              | Status   |
|-------------------|-----------------------------------|----------|
| `home`            | `/`                               | Completo |
| `auth` (login)    | `/login`                          | Completo |
| `docflow`         | `/doc-flow/...`                   | Completo (módulo em `modules/docflow/`) |
| `release-orchestrator`    | `/release-orchestrator/...`               | Completo |
| `administracao`   | `/administracao/...`              | Em uso   |
| └ `usuarios`      | `/administracao/usuarios`         | Funcional |
| └ `grupos`        | `/administracao/grupos`           | Stub     |
| └ `permissoes`    | `/administracao/permissoes`       | Stub     |
| └ `configuracoes` | `/administracao/configuracoes`    | Funcional (logo da empresa) |

## Módulos planejados (novas features)

- Release Orchestrator — spec em `docs/release-orchestrator/` (depende do backend)
- Sistemas
- Access Control
- Monitoramento
- Notificações (centro local já existe via `NotificationService` em `shared/ui/notification-center/`)

## Qualidade e dev experience

- **Testes:** 200+ specs em Karma/Jasmine, incluindo services HTTP, interceptors, guards e utils
- **Storybook:** `npm run storybook` (`:6006`) + `npm run build-storybook`
- **Lint/Format:** `npm run lint` / `npm run format`, com husky + lint-staged em pre-commit
- **PWA:** manifest + service worker (`ngsw-config.json`); só ativo em build de produção
- **Budgets:** `initial < 700kB`, `docflow-routes < 260kB`, `release-orchestrator-routes < 300kB` (definidos em `angular.json`)

## Autenticação

- JWT em `localStorage['doc-flow-jwt']`
- `AuthService` em `core/auth/` — login, logout, validação, migração de chaves legadas
- `authGuard` → redireciona para `/login`
- `guestGuard` → redireciona para `/` se já logado
- `authInterceptor` → Bearer + 401 globalmente
