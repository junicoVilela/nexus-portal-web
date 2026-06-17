import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ModuloService } from './modulo.service';
import { Modulo } from '../models/modulo.model';

const BASE = '/api/doc-flow';

describe('ModuloService', () => {
  let service: ModuloService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModuloService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ModuloService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarModulos() includes projetoId when provided', () => {
    service.listarModulos({ projetoId: 'p1', page: 1, size: 10 }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/modulos`);
    expect(req.request.params.get('projetoId')).toBe('p1');
    req.flush({ items: [], totalItems: 0 });
  });

  it('modulos() caches per projetoId', () => {
    service.modulos('p1').subscribe();
    http.expectOne(r => r.url === `${BASE}/modulos`).flush({ items: [], totalItems: 0 });
    service.modulos('p1').subscribe();
    http.expectNone(r => r.url === `${BASE}/modulos`);

    service.modulos('p2').subscribe();
    http.expectOne(r => r.url === `${BASE}/modulos`).flush({ items: [], totalItems: 0 });
  });

  it('modulos() without projetoId uses __all__ cache key', () => {
    service.modulos().subscribe();
    http.expectOne(r => r.url === `${BASE}/modulos`).flush({ items: [], totalItems: 0 });
    service.modulos().subscribe();
    http.expectNone(r => r.url === `${BASE}/modulos`);
  });

  it('modulo(id) hits /modulos/:id', () => {
    service.modulo('m1').subscribe();
    http.expectOne(`${BASE}/modulos/m1`).flush({} as Modulo);
  });

  it('salvarModulo() POSTs without id and invalidates cache', () => {
    service.modulos('p1').subscribe();
    http.expectOne(r => r.url === `${BASE}/modulos`).flush({ items: [], totalItems: 0 });

    service.salvarModulo({ nome: 'X' }).subscribe();
    http.expectOne(`${BASE}/modulos`).flush({} as Modulo);

    service.modulos('p1').subscribe();
    http.expectOne(r => r.url === `${BASE}/modulos`).flush({ items: [], totalItems: 0 });
  });

  it('salvarModulo() PUTs when id is provided', () => {
    service.salvarModulo({ nome: 'X' }, 'm1').subscribe();
    const req = http.expectOne(`${BASE}/modulos/m1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as Modulo);
  });
});
