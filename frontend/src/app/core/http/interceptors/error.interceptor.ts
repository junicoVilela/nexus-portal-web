import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService, ToastService } from '@shared/ui';

const SILENCED_STATUS = new Set([0, 401]);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        !SILENCED_STATUS.has(err.status) &&
        !req.headers.has('X-Silent-Error')
      ) {
        const message = extractMessage(err);
        const titulo = tituloPorStatus(err.status);
        toast.error(message, { title: titulo, sticky: err.status >= 500 });
        if (err.status >= 500) {
          notifications.add('danger', titulo, { description: `${req.method} ${req.url}: ${message}` });
        }
      }
      return throwError(() => err);
    }),
  );
};

function extractMessage(err: HttpErrorResponse): string {
  const body = err.error;
  if (typeof body === 'string') return body;
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (typeof obj['message'] === 'string') return obj['message'] as string;
    if (typeof obj['error'] === 'string') return obj['error'] as string;
    if (typeof obj['detail'] === 'string') return obj['detail'] as string;
  }
  if (err.status === 0) return 'Sem conexão com o servidor.';
  return err.message || 'Ocorreu um erro inesperado.';
}

function tituloPorStatus(status: number): string {
  if (status === 0) return 'Sem conexão';
  if (status === 403) return 'Sem permissão';
  if (status === 404) return 'Não encontrado';
  if (status === 409) return 'Conflito';
  if (status === 422) return 'Dados inválidos';
  if (status >= 500) return 'Erro no servidor';
  return 'Erro';
}
