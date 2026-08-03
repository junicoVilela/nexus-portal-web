import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { DominioService } from './dominio.service';

describe('DominioService', () => {
  let service: DominioService;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/catalogo/dominios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DominioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTodos() bate em /catalogo/dominios', async () => {
    const promise = firstValueFrom(service.listarTodos());
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([{
      id: 'd1', codigo: 'SEGURANCA', nome: 'Segurança', descricao: null, ativo: true,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
    }]);
    const list = await promise;
    expect(list.map(d => d.codigo)).toContain('SEGURANCA');
  });

  it('listar() pagina e filtra client-side', async () => {
    const promise = firstValueFrom(service.listar({ q: 'seg', page: 1, size: 10 }));
    const req = http.expectOne(base);
    req.flush([
      {
        id: 'd1', codigo: 'SEGURANCA', nome: 'Segurança', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
      {
        id: 'd2', codigo: 'OUTRO', nome: 'Outro', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    const page = await promise;
    expect(page.items.length).toBe(1);
    expect(page.items[0].codigo).toBe('SEGURANCA');
  });
});
