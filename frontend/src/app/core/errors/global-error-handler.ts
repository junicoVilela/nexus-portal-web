import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService, ToastService } from '@shared/ui';

/** Captura falhas de runtime que não passam pelo interceptor HTTP. */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);
  private readonly notifications = inject(NotificationService);
  private ultimoErro = '';
  private ultimoErroEm = 0;

  handleError(error: unknown): void {
    const original = this.desembrulhar(error);
    if (original instanceof HttpErrorResponse) return;

    const detalhe = original instanceof Error ? original.message : String(original || 'Erro desconhecido');
    const agora = Date.now();
    if (detalhe === this.ultimoErro && agora - this.ultimoErroEm < 2_000) return;
    this.ultimoErro = detalhe;
    this.ultimoErroEm = agora;

    this.toast.error('A tela encontrou um erro inesperado. Tente novamente.', {
      title: 'Erro na aplicação',
      sticky: true,
    });
    this.notifications.add('danger', 'Erro na aplicação', { description: detalhe });
  }

  private desembrulhar(error: unknown): unknown {
    if (error && typeof error === 'object' && 'rejection' in error) {
      return (error as { rejection: unknown }).rejection;
    }
    return error;
  }
}
