# 02 — Rotas e Shell

## 1. Registro no router raiz

`app.routes.ts`:

```ts
{
  path: 'doc-flow',
  loadChildren: () =>
    import('./modules/docflow/docflow.routes').then(m => m.DOCFLOW_ROUTES),
}
```

## 2. `DOCFLOW_ROUTES`

```ts
export const DOCFLOW_ROUTES: Routes = [
  {
    path: '',
    component: DocflowShellComponent,
    children: [
      { path: '',                        component: DashboardComponent },
      { path: 'clientes/novo',           component: ClienteFormComponent },
      { path: 'clientes/:id/editar',     component: ClienteFormComponent },
      { path: 'clientes',                component: ClientesComponent },
      { path: 'projetos/novo',           component: ProjetoFormComponent },
      { path: 'projetos/:id/editar',     component: ProjetoFormComponent },
      { path: 'projetos',                component: ProjetosComponent },
      { path: 'modulos/novo',            component: ModuloFormComponent },
      { path: 'modulos/:id/editar',      component: ModuloFormComponent },
      { path: 'modulos',                 component: ModulosComponent },
      { path: 'paginas/novo',            component: PaginaFormComponent, canDeactivate: [canDeactivateGuard] },
      { path: 'paginas/:id/editar',      component: PaginaFormComponent, canDeactivate: [canDeactivateGuard] },
      { path: 'paginas',                 component: PaginasComponent },
      { path: 'publicacoes/:id/detalhe', component: PublicacaoDetalheComponent },
      { path: 'publicacoes/novo',        component: PublicacaoFormComponent },
      { path: 'publicacoes',             component: PublicacoesComponent },
      { path: 'busca',                   component: BuscaGlobalComponent },
      { path: 'configuracoes',           component: ConfiguracoesComponent },
    ],
  },
];
```

## 3. Shell (`DocflowShellComponent`)

- Renderiza sidebar com 8 itens (Dashboard, Busca, Clientes, Projetos, Módulos, Páginas, Publicações, Configurações), filtrados por permissão.
- Registra atalhos no `CommandPaletteService` (ID `doc-flow`) em `ngOnInit`, desregistra em `ngOnDestroy`.
- Usa `RouterOutlet` + `RouterLink` + `RouterLinkActive`.

## 4. Guards aplicados

- **`canDeactivateGuard`** (de `@shared/guards`) nas rotas `paginas/novo` e `paginas/:id/editar` — bloqueia saída se o form estiver dirty (e o componente implementa `CanDeactivateComponent.hasUnsavedChanges()`).

## 5. Helper de navegação

`@core/config/doc-flow-router.util.ts` exporta `docFlowRouterCommands(['paginas', 'novo'])` que retorna o array completo para `router.navigate()`. Usar este helper para evitar paths hardcoded.
