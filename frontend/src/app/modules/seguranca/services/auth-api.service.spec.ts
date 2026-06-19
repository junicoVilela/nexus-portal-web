import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.removeItem('doc-flow-jwt');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('doc-flow-jwt');
  });

  it('login() chama POST /api/v1/auth/login e normaliza resposta', async () => {
    const promise = firstValueFrom(service.login('admin', 'admin'));
    const req = httpMock.expectOne(`${environment.authApiUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'jwt-token', username: 'admin' });

    const r = await promise;
    expect(r.token).toBe('jwt-token');
    expect(r.usuario.login).toBe('admin');
  });

  it('me() usa permissoes retornadas pela API', async () => {
    localStorage.setItem('doc-flow-jwt', 'header.payload.sig');
    const promise = firstValueFrom(service.me());
    const req = httpMock.expectOne(`${environment.authApiUrl}/me`);
    req.flush({
      id: '11111111-1111-1111-1111-111111111111',
      username: 'admin',
      nome: 'Administrador',
      email: 'admin@softon.dev',
      roles: ['ADMIN', 'EDITOR'],
      grupos: [{ id: 'g1', codigo: 'ADMIN', nome: 'Administradores' }],
      permissoes: ['CLIENTE:LER', 'CONFIGURACAO:EDITAR'],
    });

    const me = await promise;
    expect(me.permissoes).toEqual(['CLIENTE:LER', 'CONFIGURACAO:EDITAR']);
    expect(me.grupos[0].codigo).toBe('ADMIN');
  });
});
