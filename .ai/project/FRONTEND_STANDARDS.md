# Padrões Frontend

## Framework

Angular 21+ — standalone components, signals, OnPush, lazy loading por módulo.

## Linguagem

TypeScript.

## Organização por módulo

Cada módulo deve ficar em:

```text
src/app/modules/{modulo}
```

## Nomenclatura

### Pages

```text
clientes-list.component.ts / clientes.component.ts
cliente-form.component.ts
paginas-list.component.ts / paginas.component.ts
pagina-form.component.ts
publicacoes-list.component.ts / publicacoes.component.ts
publicacao-form.component.ts
publicacao-detalhe.component.ts
login.component.ts
home.component.ts
```

### Services

```text
cliente.service.ts
projeto.service.ts
usuario.service.ts
configuracao.service.ts
auth.service.ts
```

### Models

```text
cliente.model.ts
projeto.model.ts
usuario.model.ts
page-result.model.ts
```

## Padrão de módulo

```text
modules/{modulo}/
├── pages/
│   ├── {entidade}-list/
│   ├── {entidade}-form/
│   └── {entidade}-detalhe/
├── services/
│   └── {entidade}.service.ts
├── models/
│   └── {entidade}.model.ts
└── {modulo}.routes.ts
```

Novos recursos de identidade e acesso (grupos, permissões): entram em `modules/administracao/`.

## Components

Regras:

- Sempre `standalone: true` + `changeDetection: ChangeDetectionStrategy.OnPush`.
- Estado reativo via `signal()` / `computed()` (sem `@Input/@Output` decorators — usar `input()`, `output()`).
- Component deve ser focado em UI.
- Não colocar regra de negócio pesada em component.
- Não chamar HttpClient direto no component.
- Usar services.
- Separar component grande em componentes menores (ex: `pagina-form` divide em `pagina-rich-editor`, `pagina-revisoes`, `pagina-anexos`).
- Usar nomes claros.
- Páginas de listagem usam `<ui-list-page>`; páginas de form usam `<ui-form-page>`.

## Services

Regras:

- Services fazem comunicação com API.
- Services devem retornar Observable (ou Promise para casos pontuais como login).
- Services conhecem endpoints.
- Components não devem montar URL da API.

## Forms

Regras:

- Usar Reactive Forms.
- Validar campos obrigatórios.
- Exibir mensagens claras.
- Desabilitar botão de salvar quando inválido, se fizer sentido.
- Tratar loading e erro.

## Rotas

Lazy loading por feature. `app.routes.ts` usa `loadChildren`; pages individuais usam `loadComponent`.

Exemplo:

```ts
// app.routes.ts
{ path: 'doc-flow', loadChildren: () => import('./modules/docflow/docflow.routes').then(m => m.DOCFLOW_ROUTES) }
{ path: 'usuarios', loadChildren: () => import('./modules/administracao/administracao.routes').then(m => m.ADMINISTRACAO_ROUTES) }

// docflow.routes.ts
{ path: 'clientes', loadComponent: () => import('./pages/clientes/clientes-list/clientes.component').then(m => m.ClientesComponent) }
```

Novos módulos do portal: registrar em `core/config/portal-modules.registry.ts`.
Novos recursos de identidade/acesso: adicionar em `modules/administracao/`.

## Estado

Para projeto pequeno/médio:

- começar com services e RxJS simples
- não adicionar NgRx sem necessidade

## Naming de enums/status

Os tipos `StatusPagina`, `ReleaseStatus`, `StatusPublicacao` etc. **espelham os
valores enviados pelo backend**, incluindo gênero (`APROVADO` vs `APROVADA`)
e ordem de palavras. **Não renomear sem antes alinhar com o backend** —
qualquer divergência quebra a comunicação. Quando criar um type novo:

- Nome do type: `StatusX` ou `XStatus` — siga o padrão do módulo (não mude
  caso o módulo já tenha decidido).
- Valores: cópia exata do `enum` Java/TS do backend. Se backend usa
  `'APROVADA'`, o front também usa `'APROVADA'`.
- Labels visíveis (PT-BR): definir em `RECURSO_LABELS`/`STATUS_LABELS` no mesmo
  arquivo de model, separadas do enum.

## UI

Componentes próprios em `shared/ui/` (`button`, `icon-button`, `card`, `input`, `select`, `checkbox`, `switch`, `badge`, `chip`, `tooltip`, `breadcrumb`, `page-header`, `empty-state`, `error-state`, `skeleton`, `tabs`, `dialog`, `loading-bar`, `offline-banner`, `toast`, `command-palette`, `notification-center`, `avatar`) + Tailwind v4 + design tokens em `src/styles/tokens/`. Ícones via `lucide-angular` (registrar no `app.config.ts`).

Cada componente novo de `shared/ui` deve ter um `*.stories.ts` em Storybook.

Não adicionar bibliotecas de UI externas (PrimeNG, Material, etc.) sem necessidade — preferir estender `shared/ui`.

## Testes

- Karma + Jasmine; specs próximas ao arquivo testado (`x.ts` + `x.spec.ts`).
- Cobrir todo `service.ts` (HTTP, cache, mapeamento).
- Cobrir interceptors, guards e utilitários (`shared/utils/*`).
- Componentes shared/ui mais reutilizados também têm spec.
- Rodar com `npm test` (single-run via Chrome Headless).

## i18n

- `@angular/localize` instalado, `sourceLocale: 'pt-BR'` configurado em `angular.json`.
- Marcar strings de UI com `i18n` (texto) ou `i18n-attr` (atributos) e ID estável `@@nome.do.id`.
- Rodar `npm run extract-i18n` para regenerar `src/locale/messages.xlf`.
- Marque strings novas ao criar telas — facilita traduzir depois sem retrabalho.

## Quando NÃO extrair sub-componentes

Padrão de extração (`<pagina-revisoes>`, `<pagina-anexos>`, `<historico-timeline>`, `<rf-builder-timeline>`,
`<paginas-filters>`, `<release-compare>`) vale quando o componente filho:

1. tem responsabilidade clara e isolável (UI + 1-2 outputs);
2. não compartilha mais de ~3 signals/refs com o pai;
3. ganho de manutenção é claro (redução de >15% LOC do pai ou reuso futuro).

**Caso de exceção registrado:** o painel de vínculos em `clientes-list` foi avaliado para
extração em 2026-06 e **mantido inline** porque depende de 10+ signals do pai
(`clienteVinculos`, `projetoIds`, `moduloIds`, `paginaIds`, `modulosDisponiveis`,
`paginasPorModulo`, `loadingVinculos`, `savingVinculos`, etc.). Extrair exigiria
duplicar a API e introduziria risco maior que o ganho de LOC.

## Erros

Tratar erros com:

- `authInterceptor` para 401 (logout só se token realmente expirou) e Bearer token
- `errorInterceptor` para mostrar toast automaticamente (silencia 0, 401 e `X-Silent-Error`)
- Em listas: `<ui-error-state [variant]="erroVariant()" (retry)="carregar()">` + `classificarErro(err)`
- Em forms: `ToastService.error()` no callback de erro do submit
- Nunca usar `alert()` ou `console.error` em código de produção

## Loading

Toda tela de listagem, detalhe e ação importante deve ter estado de loading.
