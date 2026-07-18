import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService, ToastService } from '@shared/ui';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: ErrorHandler;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
    });
    handler = TestBed.inject(ErrorHandler);
    toast = TestBed.inject(ToastService);
    TestBed.inject(NotificationService);
  });

  it('transforma uma exceção de runtime em feedback persistente', () => {
    handler.handleError(new Error('falha de renderização'));

    expect(toast.toasts().length).toBe(1);
    expect(toast.toasts()[0].title).toBe('Erro na aplicação');
    expect(toast.toasts()[0].sticky).toBe(true);
  });

  it('deixa erros HTTP para o interceptor especializado', () => {
    handler.handleError(new HttpErrorResponse({ status: 500 }));

    expect(toast.toasts()).toEqual([]);
  });
});
