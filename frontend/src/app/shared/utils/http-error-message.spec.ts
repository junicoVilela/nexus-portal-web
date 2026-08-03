import { HttpErrorResponse } from '@angular/common/http';

import { mensagemErroHttp } from './http-error-message';

describe('mensagemErroHttp', () => {
  it('usa message do ApiError', () => {
    const err = new HttpErrorResponse({
      status: 422,
      error: { message: 'Sessão encerrada (CANCELADA).' },
    });
    expect(mensagemErroHttp(err, 'falha')).toBe('Sessão encerrada (CANCELADA).');
  });

  it('mapeia 429', () => {
    const err = new HttpErrorResponse({ status: 429, error: {} });
    expect(mensagemErroHttp(err, 'falha')).toContain('Limite');
  });

  it('mapeia status 0', () => {
    expect(mensagemErroHttp(new HttpErrorResponse({ status: 0 }), 'falha')).toContain('conexão');
  });

  it('nunca devolve stack', () => {
    const err = new HttpErrorResponse({
      status: 500,
      error: 'java.lang.NullPointerException\n\tat com.nexus...',
    });
    expect(mensagemErroHttp(err, 'falha')).not.toContain('NullPointer');
  });
});
