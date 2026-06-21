import { Routes } from '@angular/router';

import { canDeactivateGuard } from '@shared/guards';
import { ReleaseOrchestratorShellComponent } from './shell/release-orchestrator-shell.component';
import { releaseResolver } from './resolvers/release.resolver';
import { RfDashboardComponent } from './pages/dashboard/rf-dashboard.component';
import { ReleaseBuilderComponent } from './pages/builder/release-builder.component';
import { ReleasesListComponent } from './pages/releases/list/releases-list.component';
import { ReleaseFormComponent } from './pages/releases/form/release-form.component';
import { ReleaseDetalheComponent } from './pages/releases/detalhe/release-detalhe.component';
import { ReleaseRevisaoComponent } from './pages/releases/revisao/release-revisao.component';
import { RfProdutosComponent } from './pages/produtos/rf-produtos.component';
import { ModulosProdutoComponent } from './pages/produtos/modulos/modulos-produto.component';
import { ClientesListComponent } from './pages/clientes/clientes-list.component';
import { ClienteFormComponent } from './pages/clientes/cliente-form.component';
import { RfTemplatesComponent } from './pages/templates/rf-templates.component';
import { RfGuiaComponent } from './pages/guia/rf-guia.component';

export const RELEASE_ORCHESTRATOR_ROUTES: Routes = [
  {
    path: '',
    component: ReleaseOrchestratorShellComponent,
    children: [
      { path: '', component: RfDashboardComponent },
      { path: 'builder', component: ReleaseBuilderComponent },
      { path: 'releases', component: ReleasesListComponent },
      { path: 'releases/nova', component: ReleaseFormComponent, canDeactivate: [canDeactivateGuard] },
      { path: 'releases/:id/editar', component: ReleaseFormComponent, canDeactivate: [canDeactivateGuard] },
      { path: 'releases/:id', component: ReleaseDetalheComponent, resolve: { release: releaseResolver } },
      {
        path: 'releases/:id/revisao',
        component: ReleaseRevisaoComponent,
        resolve: { release: releaseResolver },
      },
      { path: 'produtos', component: RfProdutosComponent },
      { path: 'produtos/:id/modulos', component: ModulosProdutoComponent },
      { path: 'clientes', component: ClientesListComponent },
      {
        path: 'clientes/novo',
        component: ClienteFormComponent,
        canDeactivate: [canDeactivateGuard],
      },
      {
        path: 'clientes/:id/editar',
        component: ClienteFormComponent,
        canDeactivate: [canDeactivateGuard],
      },
      { path: 'templates', component: RfTemplatesComponent },
      { path: 'guia', component: RfGuiaComponent },
    ],
  },
];
