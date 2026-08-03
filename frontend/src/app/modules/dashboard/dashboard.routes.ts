import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'em-construcao',
    loadComponent: () =>
      import('./pages/em-construcao/em-construcao.component').then(m => m.EmConstrucaoComponent),
  },
];
