import { Routes } from '@angular/router';

import { canDeactivateGuard } from '@shared/guards';
import { ReleaseOrchestratorShellComponent } from './shell/release-orchestrator-shell.component';
import { releaseResolver } from './resolvers/release.resolver';

export const RELEASE_ORCHESTRATOR_ROUTES: Routes = [
  {
    path: '',
    component: ReleaseOrchestratorShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/rf-dashboard.component').then(m => m.RfDashboardComponent),
      },
      {
        path: 'builder',
        loadComponent: () =>
          import('./pages/builder/release-builder.component').then(m => m.ReleaseBuilderComponent),
      },
      {
        path: 'releases',
        loadComponent: () =>
          import('./pages/releases/list/releases-list.component').then(m => m.ReleasesListComponent),
      },
      {
        path: 'releases/nova',
        loadComponent: () =>
          import('./pages/releases/form/release-form.component').then(m => m.ReleaseFormComponent),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'releases/:id/editar',
        loadComponent: () =>
          import('./pages/releases/form/release-form.component').then(m => m.ReleaseFormComponent),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'releases/:id',
        loadComponent: () =>
          import('./pages/releases/detalhe/release-detalhe.component').then(m => m.ReleaseDetalheComponent),
        resolve: { release: releaseResolver },
      },
      {
        path: 'releases/:id/revisao',
        loadComponent: () =>
          import('./pages/releases/revisao/release-revisao.component').then(m => m.ReleaseRevisaoComponent),
        resolve: { release: releaseResolver },
      },
      {
        path: 'produtos',
        loadComponent: () =>
          import('./pages/produtos/rf-produtos.component').then(m => m.RfProdutosComponent),
      },
      {
        path: 'produtos/:id/modulos',
        loadComponent: () =>
          import('./pages/produtos/modulos/modulos-produto.component').then(m => m.ModulosProdutoComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes/clientes-list.component').then(m => m.ClientesListComponent),
      },
      {
        path: 'clientes/novo',
        loadComponent: () =>
          import('./pages/clientes/cliente-form.component').then(m => m.ClienteFormComponent),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'clientes/:id/editar',
        loadComponent: () =>
          import('./pages/clientes/cliente-form.component').then(m => m.ClienteFormComponent),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'clientes/:id',
        loadComponent: () =>
          import('./pages/clientes/cliente-detalhe/cliente-detalhe.component').then(
            m => m.ClienteDetalheComponent,
          ),
      },
      {
        path: 'proximas-entregas',
        loadComponent: () =>
          import('./pages/proximas-entregas/proximas-entregas-list.component').then(
            m => m.ProximasEntregasListComponent,
          ),
      },
      {
        path: 'proximas-entregas/nova',
        loadComponent: () =>
          import('./pages/proximas-entregas/proxima-entrega-form.component').then(
            m => m.ProximaEntregaFormComponent,
          ),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'proximas-entregas/:id/editar',
        loadComponent: () =>
          import('./pages/proximas-entregas/proxima-entrega-form.component').then(
            m => m.ProximaEntregaFormComponent,
          ),
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'entregas',
        loadComponent: () =>
          import('./pages/entregas/entregas-list.component').then(m => m.EntregasListComponent),
      },
      {
        path: 'entregas/nova',
        loadComponent: () =>
          import('./pages/entregas/entrega-wizard/entrega-wizard.component').then(
            m => m.EntregaWizardComponent,
          ),
      },
      {
        path: 'entregas/:id/delta',
        loadComponent: () =>
          import('./pages/entregas/entrega-delta/entrega-delta.component').then(
            m => m.EntregaDeltaComponent,
          ),
      },
      {
        path: 'entregas/:id',
        loadComponent: () =>
          import('./pages/entregas/entrega-detalhe/entrega-detalhe.component').then(
            m => m.EntregaDetalheComponent,
          ),
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./pages/templates/rf-templates.component').then(m => m.RfTemplatesComponent),
      },
      {
        path: 'guia',
        loadComponent: () =>
          import('./pages/guia/rf-guia.component').then(m => m.RfGuiaComponent),
      },
    ],
  },
];
