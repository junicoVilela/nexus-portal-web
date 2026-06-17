import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoadingBarService } from '@shared/ui';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let bar: LoadingBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loadingInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    bar = TestBed.inject(LoadingBarService);
    spyOn(bar, 'start').and.callThrough();
    spyOn(bar, 'end').and.callThrough();
  });

  afterEach(() => httpMock.verify());

  it('starts and ends the bar around an HTTP call', () => {
    http.get('/api/teste').subscribe();
    expect(bar.start).toHaveBeenCalled();
    const req = httpMock.expectOne('/api/teste');
    expect(bar.end).not.toHaveBeenCalled();
    req.flush({});
    expect(bar.end).toHaveBeenCalled();
  });

  it('ends the bar even when request errors', () => {
    http.get('/api/teste').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/teste').error(new ProgressEvent('error'), { status: 500 });
    expect(bar.end).toHaveBeenCalled();
  });

  it('skips bar when X-Silent-Loading header is present', () => {
    http.get('/api/teste', { headers: new HttpHeaders({ 'X-Silent-Loading': '1' }) }).subscribe();
    const req = httpMock.expectOne('/api/teste');
    req.flush({});
    expect(bar.start).not.toHaveBeenCalled();
    expect(bar.end).not.toHaveBeenCalled();
  });
});
