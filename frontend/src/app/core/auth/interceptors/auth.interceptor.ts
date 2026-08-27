import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

let redirectingToLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isLogin = req.method === 'POST' && req.url.includes('/auth/login');
  const header = isLogin ? null : authService.header();
  const request = header ? req.clone({ setHeaders: { Authorization: header } }) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !redirectingToLogin) {
        // Só desloga se o token realmente expirou ou está ausente.
        // Se o token ainda é válido, o 401 é uma restrição de acesso naquele
        // endpoint específico — não deve encerrar a sessão do usuário.
        if (!authService.isTokenValid()) {
          redirectingToLogin = true;
          authService.logout();
          setTimeout(() => {
            redirectingToLogin = false;
          }, 1000);
        }
      }
      return throwError(() => error);
    }),
  );
};
