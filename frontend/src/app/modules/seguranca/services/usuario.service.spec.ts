import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { UsuarioService } from './usuario.service';

describe('UsuarioService (HTTP)', () => {
  let service: UsuarioService;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/usuarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const backendUser = (over: Record<string, unknown> = {}) => ({
    id: 'u1',
    username: 'admin',
    nome: 'Admin',
    email: 'a@x.com',
    ativo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    createdBy: 'seed',
    updatedBy: null,
    ...over,
  });

  it('listar() aplica paginação e mapeia UsuarioResponse', async () => {
    const promise = firstValueFrom(service.listar({ page: 1, size: 10 }));
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('page')).toBe('1');
    req.flush({
      items: [backendUser()],
      page: 1, size: 10, totalItems: 1, totalPages: 1, first: true, last: true,
    });
    const res = await promise;
    expect(res.items[0].login).toBe('admin');
    expect(res.items[0].nome).toBe('Admin');
  });

  it('criar() envia payload de acordo com CriarUsuarioRequest', async () => {
    const promise = firstValueFrom(service.criar({
      nome: 'Novo', login: 'novo', email: 'n@x.com', senha: 'pw', ativo: true, grupoIds: [],
    }));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'novo', password: 'pw', nome: 'Novo', email: 'n@x.com',
    });
    req.flush(backendUser({ id: 'u2', username: 'novo', nome: 'Novo', email: 'n@x.com' }));
    const u = await promise;
    expect(u.login).toBe('novo');
  });

  it('criar() sem senha rejeita antes de bater no backend', async () => {
    await expectAsync(firstValueFrom(service.criar({
      nome: 'X', login: 'x', email: 'x@x.com', ativo: true, grupoIds: [],
    }))).toBeRejected();
    http.expectNone(base);
  });

  it('atualizar() envia payload PUT', async () => {
    const promise = firstValueFrom(service.atualizar('u1', {
      nome: 'Novo Nome', login: 'admin', email: 'a@x.com', ativo: false, grupoIds: [],
    }));
    const req = http.expectOne(`${base}/u1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nome: 'Novo Nome', email: 'a@x.com', ativo: false });
    req.flush(backendUser({ nome: 'Novo Nome', ativo: false }));
    const u = await promise;
    expect(u.ativo).toBe(false);
  });

  it('resetarSenha() bate no /alterar-senha', async () => {
    const promise = firstValueFrom(service.resetarSenha('u1', 'nova'));
    const req = http.expectOne(`${base}/u1/alterar-senha`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ novaSenha: 'nova' });
    req.flush(null);
    await promise;
  });
});
