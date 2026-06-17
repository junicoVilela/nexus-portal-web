import { Routes } from '@angular/router';

/** Rota pública: /login (canActivate: guestGuard no app.routes.ts) */
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
];
