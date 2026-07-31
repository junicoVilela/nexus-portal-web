import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ModuloService } from './modulo.service';
import { Modulo } from '../models/modulo.model';

const GENERATED_BASE = '/api/v1/docflow';

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

  it('listarModulos() includes projetoId when provided', fakeAsync(() => {
    service.listarModulos({ projetoId: 'p1', page: 1, size: 10 }).subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`));
    expect(req.request.url).toContain('projetoId=p1');
    req.flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('modulos() caches per projetoId', fakeAsync(() => {
    service.modulos('p1').subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`)).flush({ items: [], totalItems: 0 });
    tick();
    service.modulos('p1').subscribe();
    tick();
    http.expectNone(r => r.url.startsWith(`${GENERATED_BASE}/modulos`));

    service.modulos('p2').subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`)).flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('modulos() without projetoId uses __all__ cache key', fakeAsync(() => {
    service.modulos().subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`)).flush({ items: [], totalItems: 0 });
    tick();
    service.modulos().subscribe();
    tick();
    http.expectNone(r => r.url.startsWith(`${GENERATED_BASE}/modulos`));
  }));

  it('modulo(id) hits /modulos/:id', fakeAsync(() => {
    service.modulo('m1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/modulos/m1`).flush({} as Modulo);
    tick();
  }));

  it('salvarModulo() POSTs without id and invalidates cache', fakeAsync(() => {
    service.modulos('p1').subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`)).flush({ items: [], totalItems: 0 });
    tick();

    service.salvarModulo({ nome: 'X' }).subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/modulos`).flush({} as Modulo);
    tick();

    service.modulos('p1').subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`)).flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('salvarModulo() PUTs when id is provided', fakeAsync(() => {
    service.salvarModulo({ nome: 'X' }, 'm1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/modulos/m1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as Modulo);
    tick();
  }));

  it('excluirModulo() DELETEs e invalida o cache', fakeAsync(() => {
    service.modulos('p1').subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`)).flush({ items: [], totalItems: 0 });
    tick();

    service.excluirModulo('m1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/modulos/m1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();

    service.modulos('p1').subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/modulos`)).flush({ items: [], totalItems: 0 });
    tick();
  }));
});
