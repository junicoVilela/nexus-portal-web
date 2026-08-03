import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { FuncionalidadeService } from './funcionalidade.service';

describe('FuncionalidadeService', () => {
  let service: FuncionalidadeService;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/catalogo/funcionalidades`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FuncionalidadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPorDominio() filtra pelo dominioId', async () => {
    const dominioId = 'dom-seg';
    const promise = firstValueFrom(service.listarPorDominio(dominioId));
    const req = http.expectOne(base);
    req.flush([
      {
        id: 'f1', dominioId, dominioCodigo: 'SEGURANCA',
        codigo: 'USUARIO', nome: 'Usuário', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
      {
        id: 'f2', dominioId: 'outro-id', dominioCodigo: 'OUTRO',
        codigo: 'X', nome: 'X', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    const r = await promise;
    expect(r.every(f => f.dominioId === dominioId)).toBe(true);
    expect(r.length).toBe(1);
  });

  it('listar() aplica filtro ativo', async () => {
    const promise = firstValueFrom(service.listar({ ativo: false }));
    const req = http.expectOne(base);
    req.flush([
      {
        id: 'f1', dominioId: 'd1', dominioCodigo: 'SEG',
        codigo: 'A', nome: 'Ativa', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
      {
        id: 'f2', dominioId: 'd1', dominioCodigo: 'SEG',
        codigo: 'B', nome: 'Inativa', descricao: null, ativo: false,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    const page = await promise;
    expect(page.items.length).toBe(1);
    expect(page.items[0].ativo).toBe(false);
  });
});
