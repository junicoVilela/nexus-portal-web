import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjetoService } from './projeto.service';
import { Projeto } from '../models/projeto.model';

const GENERATED_BASE = '/api/v1/docflow';

describe('ProjetoService', () => {
  let service: ProjetoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjetoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjetoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarProjetos() sends params', fakeAsync(() => {
    service.listarProjetos({ nome: 'a', page: 2, size: 5 }).subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/projetos`));
    expect(req.request.url).toContain('page=2');
    req.flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('projetos() caches and replays on second call', fakeAsync(() => {
    service.projetos().subscribe();
    tick();
    const first = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/projetos`));
    first.flush({ items: [{ id: 'p1' } as Projeto], totalItems: 1 });
    tick();

    service.projetos().subscribe(items => expect(items[0].id).toBe('p1'));
    tick();
    http.expectNone(r => r.url.startsWith(`${GENERATED_BASE}/projetos`));
  }));

  it('projeto(id) hits /projetos/:id', fakeAsync(() => {
    service.projeto('p1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/projetos/p1`).flush({} as Projeto);
    tick();
  }));

  it('salvarProjeto() POSTs without id and invalidates cache', fakeAsync(() => {
    service.projetos().subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/projetos`)).flush({ items: [], totalItems: 0 });
    tick();

    service.salvarProjeto({ nome: 'X' }).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/projetos`);
    expect(req.request.method).toBe('POST');
    req.flush({} as Projeto);
    tick();

    service.projetos().subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/projetos`)).flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('salvarProjeto() PUTs when id is provided', fakeAsync(() => {
    service.salvarProjeto({ nome: 'X' }, 'p1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/projetos/p1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as Projeto);
    tick();
  }));

  it('excluirProjeto() DELETEs e invalida o cache', fakeAsync(() => {
    service.projetos().subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/projetos`)).flush({ items: [], totalItems: 0 });
    tick();

    service.excluirProjeto('p1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/projetos/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();

    service.projetos().subscribe();
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/projetos`)).flush({ items: [], totalItems: 0 });
    tick();
  }));
});
