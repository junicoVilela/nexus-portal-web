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
      // Temporário: módulos ocultos apontam para página "Em construção"
      { path: 'seguranca', redirectTo: '/em-construcao', pathMatch: 'prefix' },
      { path: 'release-orchestrator', redirectTo: '/em-construcao', pathMatch: 'prefix' },
      // Redirects de compatibilidade
      { path: 'ai', redirectTo: 'doc-flow/assistente', pathMatch: 'prefix' },
      { path: 'administracao', redirectTo: '/em-construcao', pathMatch: 'prefix' },
      { path: 'usuarios', redirectTo: '/em-construcao', pathMatch: 'full' },
      { path: 'configuracoes', redirectTo: 'doc-flow/configuracoes', pathMatch: 'full' },
      { path: 'sistema/configuracoes', redirectTo: 'doc-flow/configuracoes', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
