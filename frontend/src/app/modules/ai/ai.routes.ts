import { Routes } from '@angular/router';

import { permissaoGuard } from '@modules/identity-access/guards';

export const AI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/ai-shell.component').then(m => m.AiShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/ai-home.component').then(m => m.AiHomeComponent),
      },
      {
        path: 'assistente',
        loadComponent: () =>
          import('./pages/assistente/ai-assistente.component').then(
            m => m.AiAssistenteComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:CRIAR'] },
      },
      {
        path: 'propostas',
        loadComponent: () =>
          import('./pages/propostas/ai-propostas.component').then(
            m => m.AiPropostasComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
    ],
  },
];
