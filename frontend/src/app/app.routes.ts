import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/guards/auth.guard';
import { guestGuard } from '@core/auth/guards/guest.guard';
import { AppShellComponent } from '@core/layout/shell/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadChildren: () => import('./core/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./modules/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'doc-flow',
        loadChildren: () => import('./modules/docflow/docflow.routes').then(m => m.DOCFLOW_ROUTES),
      },
      {
        path: 'seguranca',
        loadChildren: () => import('./modules/seguranca/seguranca.routes').then(m => m.SEGURANCA_ROUTES),
      },
      {
        path: 'release-orchestrator',
        loadChildren: () =>
          import('./modules/release-orchestrator/release-orchestrator.routes').then(m => m.RELEASE_ORCHESTRATOR_ROUTES),
      },
      // Redirects de compatibilidade
      { path: 'administracao', redirectTo: 'seguranca', pathMatch: 'full' },
      { path: 'administracao/usuarios', redirectTo: 'seguranca/usuarios', pathMatch: 'full' },
      { path: 'administracao/grupos', redirectTo: 'seguranca/grupos', pathMatch: 'full' },
      {
        path: 'administracao/permissoes',
        redirectTo: 'seguranca/dominios',
        pathMatch: 'full',
      },
      {
        path: 'administracao/configuracoes',
        redirectTo: 'doc-flow/configuracoes',
        pathMatch: 'full',
      },
      { path: 'usuarios', redirectTo: 'seguranca/usuarios', pathMatch: 'full' },
      { path: 'configuracoes', redirectTo: 'doc-flow/configuracoes', pathMatch: 'full' },
      { path: 'sistema/configuracoes', redirectTo: 'doc-flow/configuracoes', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
