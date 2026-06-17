import { HttpErrorResponse } from '@angular/common/http';
import { ErrorVariant } from '@shared/ui';

/** Classifica um erro HTTP em um variant do `<ui-error-state>`. */
export function classificarErro(err: unknown): ErrorVariant {
  if (!(err instanceof HttpErrorResponse)) return 'generic';
  if (err.status === 0) return 'network';
  if (err.status === 401 || err.status === 403) return 'permission';
  if (err.status === 404) return 'notfound';
  if (err.status >= 500) return 'server';
  return 'generic';
}
