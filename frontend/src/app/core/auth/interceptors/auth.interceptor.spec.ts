import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

class AuthStub {
  private h: string | null = null;
  private valid = true;
  logoutSpy = jasmine.createSpy('logout');

  setHeader(h: string | null): void {
    this.h = h;
  }
  setValid(v: boolean): void {
    this.valid = v;
  }
  header(): string | null {
    return this.h;
  }
  isTokenValid(): boolean {
    return this.valid;
  }
  logout(): void {
    this.logoutSpy();
  }
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useClass: AuthStub },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService) as unknown as AuthStub;
  });

  afterEach(() => httpMock.verify());

  it('adds Authorization header when authService.header() returns a value', () => {
    auth.setHeader('Bearer xyz');
    http.get('/api/teste').subscribe();
    const req = httpMock.expectOne('/api/teste');
    expect(req.request.headers.get('Authorization')).toBe('Bearer xyz');
    req.flush({});
  });

  it('does not set Authorization when authService.header() returns null', () => {
    auth.setHeader(null);
    http.get('/api/teste').subscribe();
    const req = httpMock.expectOne('/api/teste');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('calls logout on 401 when token is invalid', done => {
    auth.setHeader('Bearer expired');
    auth.setValid(false);
    http.get('/api/teste').subscribe({
      error: () => {
        expect(auth.logoutSpy).toHaveBeenCalled();
        done();
      },
    });
    httpMock.expectOne('/api/teste').error(new ProgressEvent('error'), { status: 401 });
  });

  it('does not logout on 401 when token is still valid (endpoint-level forbidden)', done => {
    auth.setHeader('Bearer ok');
    auth.setValid(true);
    http.get('/api/restricted').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        expect(auth.logoutSpy).not.toHaveBeenCalled();
        done();
      },
    });
    httpMock.expectOne('/api/restricted').error(new ProgressEvent('error'), { status: 401 });
  });

  it('rethrows non-401 errors without touching auth', done => {
    auth.setHeader('Bearer ok');
    auth.setValid(true);
    http.get('/api/teste').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
        expect(auth.logoutSpy).not.toHaveBeenCalled();
        done();
      },
    });
    httpMock.expectOne('/api/teste').error(new ProgressEvent('error'), { status: 500 });
  });

  it('does not attach Authorization on POST /auth/login', () => {
    auth.setHeader('Bearer leftover');
    http.post('/api/v1/auth/login', { username: 'admin', password: 'admin' }).subscribe();
    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ token: 't', username: 'admin' });
  });
});
