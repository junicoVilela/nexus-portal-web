# Arquitetura Angular

Esta aplicação usa organização por feature (módulo de negócio):

- `core/`: infraestrutura singleton da aplicação — autenticação, guards, interceptors.
- `layout/`: componentes estruturais globais (shell, sidebar, header).
- `shared/`: modelos e componentes reutilizáveis sem regra de negócio de feature.
- `features/`: cada módulo de negócio com suas próprias pages, services e models.

## Estrutura

```text
src/app/
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   └── navigation/
├── layout/
│   └── app-shell/
├── shared/
│   ├── components/
│   ├── models/
│   │   └── page-result.model.ts
│   └── utils/
│       ├── http-params.util.ts
│       └── query-state.ts
└── features/
    ├── docflow/
    │   ├── models/    (cliente, projeto, modulo, pagina, publicacao)
    │   ├── services/  (cliente, projeto, modulo, pagina, publicacao)
    │   ├── pages/
    │   └── docflow.routes.ts
    ├── auditoria/
    │   ├── models/
    │   ├── services/
    │   ├── pages/
    │   └── auditoria.routes.ts
    ├── usuarios/
    │   ├── models/
    │   ├── services/
    │   ├── pages/
    │   └── usuarios.routes.ts
    └── configuracoes/
        ├── services/
        ├── pages/
        └── configuracoes.routes.ts
```

## Convenções

- Services fazem chamadas HTTP; components chamam services.
- Models representam request/response da API.
- Componentes reutilizáveis entre features ficam em `shared/components/`.
- Rotas usam lazy loading por feature (`loadComponent` / `loadChildren`).
- Aliases disponíveis: `@app`, `@core`, `@features`, `@shared`, `@layout`, `@env`.
