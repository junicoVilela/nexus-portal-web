import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrai mensagem amigável de erros HTTP (sem stack).
 * Preferência: {@code error.message} do {@code ApiError} do backend.
 */
export function mensagemErroHttp(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    if (err && typeof err === 'object' && 'error' in err) {
      return mensagemErroHttp(
        new HttpErrorResponse({
          status: (err as { status?: number }).status ?? 0,
          error: (err as { error?: unknown }).error,
        }),
        fallback,
      );
    }
    return fallback;
  }

  if (err.status === 0) {
    return 'Sem conexão com o servidor. Verifique a rede e tente novamente.';
  }
  if (err.status === 429) {
    return extrairMensagem(err) || 'Limite de uso da IA atingido. Aguarde e tente novamente.';
  }
  if (err.status === 503) {
    return extrairMensagem(err) || 'Módulo AI desabilitado no backend.';
  }
  if (err.status === 422 || err.status === 400) {
    return extrairMensagem(err) || 'Dados inválidos. Revise o briefing e tente novamente.';
  }
  if (err.status >= 500) {
    return 'Falha temporária no servidor. Tente novamente em instantes.';
  }

  return extrairMensagem(err) || fallback;
}

function extrairMensagem(err: HttpErrorResponse): string | null {
  const body = err.error;
  if (typeof body === 'string' && body.trim() && !body.includes('Exception') && body.length < 400) {
    return body.trim();
  }
  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    const errors = (body as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length && typeof errors[0] === 'string') {
      return errors[0];
    }
  }
  return null;
}
