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
    path: "",
    component: DocflowShellComponent,
    children: [
      { path: "", component: DashboardComponent },
      { path: "clientes/novo", component: ClienteFormComponent },
      { path: "clientes/:id/editar", component: ClienteFormComponent },
      { path: "clientes", component: ClientesComponent },
      { path: "projetos/novo", component: ProjetoFormComponent },
      { path: "projetos/:id/editar", component: ProjetoFormComponent },
      { path: "projetos", component: ProjetosComponent },
      { path: "modulos/novo", component: ModuloFormComponent },
      { path: "modulos/:id/editar", component: ModuloFormComponent },
      { path: "modulos", component: ModulosComponent },
      {
        path: "paginas/novo",
        component: PaginaFormComponent,
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: "paginas/:id/editar",
        component: PaginaFormComponent,
        canDeactivate: [canDeactivateGuard],
      },
      { path: "paginas", component: PaginasComponent },
      { path: "revisoes", component: RevisoesComponent },
      { path: "midias", component: MidiasComponent },
      {
        path: "publicacoes/:id/detalhe",
        component: PublicacaoDetalheComponent,
      },
      { path: "publicacoes/novo", component: PublicacaoFormComponent },
      { path: "publicacoes", component: PublicacoesComponent },
      { path: "busca", component: BuscaGlobalComponent },
      { path: "configuracoes", component: ConfiguracoesComponent },
      { path: "ajuda/gerenciar", component: AjudaAdminComponent },
      { path: "ajuda", component: AjudaComponent },
    ],
  },
];
```

## 3. Shell (`DocflowShellComponent`)

- Renderiza sidebar com 10 itens (Dashboard, Clientes, Projetos, Módulos, Páginas, Revisões,
  Mídia, Publicações, Configurações e Ajuda), filtrados por permissão.
- Registra atalhos no `CommandPaletteService` (ID `doc-flow`) em `ngOnInit`, desregistra em `ngOnDestroy`.
- Usa `RouterOutlet` + `RouterLink` + `RouterLinkActive`.

`/revisoes` centraliza a fila `EM_REVISAO`, checklist, comentários, diff, aprovação e
devolução. `/midias` oferece catálogo paginado e pesquisável dos anexos de todas as páginas.
`/ajuda` exige `AJUDA:LER` e oferece jornadas pesquisáveis, progresso persistido, mídias e FAQ.
O shell injeta um botão de ajuda contextual em todas as rotas do Doc Flow, com onboarding e
tour guiado. Drawer e tour restauram o foco ao fechar, contêm a navegação por Tab enquanto
abertos e podem ser encerrados por `Esc`.
`/ajuda/gerenciar` exige `AJUDA:EDITAR` e administra conteúdo e métricas de uso.

## 4. Guards aplicados

- **`canDeactivateGuard`** (de `@shared/guards`) nas rotas `paginas/novo` e `paginas/:id/editar` — bloqueia saída se o form estiver dirty (e o componente implementa `CanDeactivateComponent.hasUnsavedChanges()`).

## 5. Helper de navegação

`@core/config/doc-flow-router.util.ts` exporta `docFlowRouterCommands(['paginas', 'novo'])` que retorna o array completo para `router.navigate()`. Usar este helper para evitar paths hardcoded.
