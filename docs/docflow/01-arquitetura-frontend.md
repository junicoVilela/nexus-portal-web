# 01 — Arquitetura Frontend

## 1. Camadas

```
shell        → sidebar + outlet (DocflowShellComponent)
pages/*      → componentes de tela (containers, fazem I/O via services)
components/* → componentes específicos do módulo (status-badge, etc.)
services/*   → wrappers de HttpClient, retornam Observable
models/*     → interfaces TS espelhando contratos do backend
```

## 2. Dependências entre camadas

- `pages` importa de `services`, `models`, `components`, `@shared/ui`, `@shared/components`, `@shared/layouts`, `@shared/guards`.
- `services` importa de `models` e `@shared` utils.
- `components` importa só de `@shared/ui` e `models`.
- `models` é puro TS, sem deps de Angular ou RxJS.

## 3. Aliases de path

```text
@modules/docflow/*   → src/app/modules/docflow/*
@shared/*            → src/app/shared/*
@core/*              → src/app/core/*
@env/*               → src/environments/*
```

Definidos em `tsconfig.json:paths`.

## 4. Padrões obrigatórios

- **Standalone components** — nada de `NgModule`.
- **Lazy loading** — `loadComponent` em cada rota filha.
- **OnPush** quando possível.
- **Reactive Forms** — nunca template-driven.
- **Observable-first** — services retornam Observable; component subscribe.
- **`PageResult<T>`** de `@shared/models/page-result.model` para listas paginadas.
- **`buildQueryParams`** de `@shared/utils/http-params.util` para HttpParams.

## 5. Como adicionar uma nova página

1. Crie `pages/<area>/<feature>/<feature>.component.{ts,html,css}`.
2. Adicione rota em `docflow.routes.ts`.
3. Se for formulário com risco de perda de trabalho, marque a rota com `canDeactivate: [canDeactivateGuard]`.
4. Use `PageHeaderComponent` ou `ListPageComponent` / `FormPageComponent` de `@shared/layouts` quando se enquadrar.
5. Para empty state, use `EmptyStateComponent` direto ou via `emptyTitle` do `ListPageComponent`.
6. Para ações destrutivas, use `ConfirmService.confirm({...})` antes do HTTP.

## 6. Como adicionar um service

1. Crie `services/<entidade>.service.ts` com `@Injectable({ providedIn: 'root' })`.
2. Use `environment.apiUrl` + path do backend.
3. Retorne `Observable<T>` ou `Observable<PageResult<T>>`.
4. Não cacheie nada no service sem necessidade clara.
