import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
  });

  it('starts empty', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('pushes a toast for each helper variant', () => {
    service.success('ok');
    service.error('falhou');
    service.warn('atenção');
    service.info('aviso');

    const list = service.toasts();
    expect(list.length).toBe(4);
    expect(list.map(t => t.variant)).toEqual(['success', 'error', 'warn', 'info']);
    expect(list.map(t => t.message)).toEqual(['ok', 'falhou', 'atenção', 'aviso']);
  });

  it('assigns sequential ids', () => {
    service.info('a');
    service.info('b');
    const [a, b] = service.toasts();
    expect(b.id).toBe(a.id + 1);
  });

  it('honors title and sticky options', () => {
    service.success('Concluído', { title: 'Sucesso', sticky: true });
    const [t] = service.toasts();
    expect(t.title).toBe('Sucesso');
    expect(t.sticky).toBe(true);
  });

  it('auto-dismisses non-sticky toasts after duration', fakeAsync(() => {
    service.info('temporário', { durationMs: 100 });
    expect(service.toasts().length).toBe(1);
    tick(99);
    expect(service.toasts().length).toBe(1);
    tick(1);
    expect(service.toasts().length).toBe(0);
  }));

  it('keeps sticky toasts beyond default duration', fakeAsync(() => {
    service.error('falha persistente', { sticky: true });
    tick(60_000);
    expect(service.toasts().length).toBe(1);
  }));

  it('dismiss(id) removes the matching toast', () => {
    service.info('um');
    service.info('dois');
    const [first] = service.toasts();
    service.dismiss(first.id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('dois');
  });
});
