import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService, ToastService } from '@shared/ui';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toast: ToastService;
  let notifications: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    notifications = TestBed.inject(NotificationService);
    spyOn(toast, 'error');
    spyOn(notifications, 'add');
  });

  afterEach(() => httpMock.verify());

  it('shows toast with title "Erro no servidor" and sticky=true on 5xx', done => {
    http.get('/api/x').subscribe({
      error: () => {
        expect(toast.error).toHaveBeenCalled();
        const args = (toast.error as jasmine.Spy).calls.mostRecent().args;
        expect(args[1]).toEqual(jasmine.objectContaining({ title: 'Erro no servidor', sticky: true }));
        done();
      },
    });
    httpMock.expectOne('/api/x').flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });

  it('shows toast with title "Dados inválidos" on 422', done => {
    http.get('/api/x').subscribe({
      error: () => {
        const args = (toast.error as jasmine.Spy).calls.mostRecent().args;
        expect(args[0]).toBe('campo obrigatório');
        expect(args[1]).toEqual(jasmine.objectContaining({ title: 'Dados inválidos', sticky: false }));
        done();
      },
    });
    httpMock
      .expectOne('/api/x')
      .flush({ message: 'campo obrigatório' }, { status: 422, statusText: 'Unprocessable' });
  });

  it('silences status 0 (network)', done => {
    http.get('/api/x').subscribe({
      error: () => {
        expect(toast.error).not.toHaveBeenCalled();
        done();
      },
    });
    httpMock.expectOne('/api/x').error(new ProgressEvent('error'), { status: 0 });
  });

  it('silences status 401 (handled by authInterceptor)', done => {
    http.get('/api/x').subscribe({
      error: () => {
        expect(toast.error).not.toHaveBeenCalled();
        done();
      },
    });
    httpMock.expectOne('/api/x').flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('respects X-Silent-Error header', done => {
    http.get('/api/x', { headers: new HttpHeaders({ 'X-Silent-Error': '1' }) }).subscribe({
      error: () => {
        expect(toast.error).not.toHaveBeenCalled();
        done();
      },
    });
    httpMock.expectOne('/api/x').flush({}, { status: 500, statusText: 'oops' });
  });

  it('falls back to err.message when body has no usable text', done => {
    http.get('/api/x').subscribe({
      error: () => {
        const args = (toast.error as jasmine.Spy).calls.mostRecent().args;
        expect(typeof args[0]).toBe('string');
        expect((args[0] as string).length).toBeGreaterThan(0);
        done();
      },
    });
    httpMock.expectOne('/api/x').flush(null, { status: 503, statusText: 'Down' });
  });

  it('adds notification on 5xx with method, URL and message', done => {
    http.get('/api/falha').subscribe({
      error: () => {
        expect(notifications.add).toHaveBeenCalled();
        const args = (notifications.add as jasmine.Spy).calls.mostRecent().args;
        expect(args[0]).toBe('danger');
        expect(args[1]).toBe('Erro no servidor');
        expect((args[2] as { description: string }).description).toContain('GET /api/falha');
        expect((args[2] as { description: string }).description).toContain('explodiu');
        done();
      },
    });
    httpMock
      .expectOne('/api/falha')
      .flush({ message: 'explodiu' }, { status: 502, statusText: 'Bad Gateway' });
  });

  it('does not add notification for non-5xx errors', done => {
    http.get('/api/x').subscribe({
      error: () => {
        expect(notifications.add).not.toHaveBeenCalled();
        done();
      },
    });
    httpMock.expectOne('/api/x').flush({}, { status: 404, statusText: 'Not Found' });
  });
});
