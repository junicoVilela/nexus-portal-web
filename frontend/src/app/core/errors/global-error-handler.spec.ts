import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService, ToastService } from '@shared/ui';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: ErrorHandler;
  let toast: ToastService;
  let consoleError: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
    });
    handler = TestBed.inject(ErrorHandler);
    toast = TestBed.inject(ToastService);
    TestBed.inject(NotificationService);
    consoleError = spyOn(console, 'error');
  });

  it('transforma uma exceção de runtime em feedback persistente', () => {
    handler.handleError(new Error('falha de renderização'));

    expect(toast.toasts().length).toBe(1);
    expect(toast.toasts()[0].title).toBe('Erro na aplicação');
    expect(toast.toasts()[0].message).toMatch(/^A tela encontrou um erro inesperado\. Tente novamente\. Código: ERR-/);
    expect(toast.toasts()[0].sticky).toBe(true);
    expect(consoleError).toHaveBeenCalled();
  });

  it('deixa erros HTTP para o interceptor especializado', () => {
    handler.handleError(new HttpErrorResponse({ status: 500 }));

    expect(toast.toasts()).toEqual([]);
  });

  it('evita uma cascata de notificações para erros distintos em sequência', () => {
    handler.handleError(new Error('primeiro erro'));
    handler.handleError(new Error('segundo erro'));

    expect(toast.toasts()).toHaveSize(1);
  });
});
