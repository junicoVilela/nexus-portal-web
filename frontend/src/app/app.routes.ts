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
        loadChildren: () =>
          import('./modules/identity-access/identity-access.routes').then(m => m.IDENTITY_ACCESS_ROUTES),
      },
      {
        path: 'release-orchestrator',
        loadChildren: () =>
          import('./modules/release-orchestrator/release-orchestrator.routes').then(
            m => m.RELEASE_ORCHESTRATOR_ROUTES,
          ),
      },
      // Redirects de compatibilidade
      { path: 'orchestrator', redirectTo: 'release-orchestrator', pathMatch: 'prefix' },
      { path: 'ai', redirectTo: 'doc-flow/assistente', pathMatch: 'prefix' },
      { path: 'administracao', redirectTo: 'seguranca', pathMatch: 'full' },
      { path: 'administracao/usuarios', redirectTo: 'seguranca/usuarios', pathMatch: 'full' },
      { path: 'administracao/grupos', redirectTo: 'seguranca/grupos', pathMatch: 'full' },
      { path: 'administracao/permissoes', redirectTo: 'seguranca/dominios', pathMatch: 'full' },
      { path: 'usuarios', redirectTo: 'seguranca/usuarios', pathMatch: 'full' },
      { path: 'configuracoes', redirectTo: 'doc-flow/configuracoes', pathMatch: 'full' },
      { path: 'sistema/configuracoes', redirectTo: 'doc-flow/configuracoes', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
