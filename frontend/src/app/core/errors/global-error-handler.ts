import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject, isDevMode } from '@angular/core';
import { NotificationService, ToastService } from '@shared/ui';

/** Captura falhas de runtime que não passam pelo interceptor HTTP. */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);
  private readonly notifications = inject(NotificationService);
  private ultimaNotificacaoEm = 0;

  handleError(error: unknown): void {
    const original = this.desembrulhar(error);
    if (original instanceof HttpErrorResponse) return;

    const detalhe = original instanceof Error ? original.message : String(original || 'Erro desconhecido');
    const agora = Date.now();
    const referencia = this.codigoReferencia(detalhe);
    if (isDevMode()) {
      console.error(`[${referencia}] Erro não tratado na aplicação`, original);
    }
    if (agora - this.ultimaNotificacaoEm < 3_000) return;
    this.ultimaNotificacaoEm = agora;

    this.toast.error(`A tela encontrou um erro inesperado. Tente novamente. Código: ${referencia}.`, {
      title: 'Erro na aplicação',
      sticky: true,
    });
    this.notifications.add('danger', 'Erro na aplicação', { description: `${referencia}: ${detalhe}` });
  }

  private desembrulhar(error: unknown): unknown {
    if (error && typeof error === 'object' && 'rejection' in error) {
      return (error as { rejection: unknown }).rejection;
    }
    return error;
  }

  private codigoReferencia(detalhe: string): string {
    let hash = 0;
    for (let index = 0; index < detalhe.length; index += 1) {
      hash = (hash * 31 + detalhe.charCodeAt(index)) | 0;
    }
    return `ERR-${(hash >>> 0).toString(36).toUpperCase()}`;
  }
}
