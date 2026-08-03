import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';

/**
 * Guard que exige uma ou mais permissões na rota.
 *
 * Uso em `Route`:
 * ```ts
 * {
 *   path: 'usuarios',
 *   canActivate: [authGuard, permissaoGuard],
 *   data: { permissoes: ['USUARIO:LER'] },
 * }
 * ```
 *
 * Aceita múltiplas permissões — usuário precisa ter **TODAS** (AND).
 * Para OR, use uma única chave que represente o caso (ex.: `USUARIO:GERIR`).
 */
export const permissaoGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const necessarias = (route.data?.['permissoes'] as string[] | undefined) ?? [];
  if (necessarias.length === 0) return true;

  const tem = auth.tem();
  const ok = necessarias.every(p => tem(p));
  if (ok) return true;
  return router.parseUrl('/seguranca/acesso-negado');
};
