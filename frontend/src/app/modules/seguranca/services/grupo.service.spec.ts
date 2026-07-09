import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { GrupoService } from './grupo.service';

describe('GrupoService (HTTP)', () => {
  let service: GrupoService;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/grupos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GrupoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() bate no /grupos com paginação e mapeia', async () => {
    const promise = firstValueFrom(service.listar({ page: 2, size: 30, q: 'ed' }));
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('30');
    expect(req.request.params.get('nome')).toBe('ed');
    req.flush({
      items: [
        {
          id: 'g1', codigo: 'EDITOR', nome: 'Editores', descricao: null, ativo: true,
          permissoes: [], totalUsuarios: 2,
          createdAt: '2026-01-01T00:00:00Z', updatedAt: null, createdBy: 'seed', updatedBy: null,
        },
      ],
      page: 2, size: 30, totalItems: 1, totalPages: 1, first: false, last: true,
    });
    const res = await promise;
    expect(res.items[0].codigo).toBe('EDITOR');
    expect(res.items[0].totalUsuarios).toBe(2);
  });

  it('criar() faz POST com payload plano', async () => {
    const promise = firstValueFrom(service.criar({ nome: 'X', codigo: 'X', descricao: 'd', ativo: true }));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nome: 'X', descricao: 'd', ativo: true });
    req.flush({
      id: 'g1', codigo: 'X', nome: 'X', descricao: 'd', ativo: true,
      permissoes: [], totalUsuarios: 0,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: null, createdBy: 'admin', updatedBy: null,
    });
    const grupo = await promise;
    expect(grupo.codigo).toBe('X');
  });

  it('alterarStatus() faz PATCH /status', async () => {
    const promise = firstValueFrom(service.alterarStatus('g1', false));
    const req = http.expectOne(`${base}/g1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ativo: false });
    req.flush({
      id: 'g1', codigo: 'X', nome: 'X', descricao: null, ativo: false,
      permissoes: [], totalUsuarios: 0,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: null, createdBy: 'admin', updatedBy: null,
    });
    const g = await promise;
    expect(g.ativo).toBe(false);
  });

  it('listarMembros() faz GET /usuarios', async () => {
    const promise = firstValueFrom(service.listarMembros('g1'));
    const req = http.expectOne(`${base}/g1/usuarios`);
    expect(req.request.method).toBe('GET');
    req.flush(['u1', 'u2']);
    const membros = await promise;
    expect(membros).toEqual(['u1', 'u2']);
  });
});
