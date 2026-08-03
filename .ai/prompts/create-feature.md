# Prompt - Criar Módulo Frontend

Crie um novo módulo Angular seguindo o padrão do Nexus Portal Web.

## Localização

Todo módulo de negócio vive em `src/app/modules/{nome}/`. Não usar `features/`.

## Estrutura obrigatória

```text
src/app/modules/{nome}/
├── pages/
├── components/         (opcional — componentes só do módulo)
├── services/
├── models/
├── {nome}.routes.ts
└── index.ts            (opcional)
```

## Regras

- Não chamar HttpClient direto em component — sempre via service do módulo.
- Criar models tipando request/response.
- Páginas com listagem, formulário e detalhe quando necessário.
- Usar shared components (`@shared/*`) para loading, empty state, confirmação e status.
- Lazy loading nas rotas (`loadComponent` / `loadChildren`).
- Registrar o módulo em `core/config/portal-modules.registry.ts` quando ele tiver entrada na home.
- Auth, layout e config NÃO viram módulo — moram em `core/`.
