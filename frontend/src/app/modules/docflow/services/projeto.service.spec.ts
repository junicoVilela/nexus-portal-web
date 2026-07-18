import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjetoService } from './projeto.service';
import { Projeto } from '../models/projeto.model';

const BASE = '/api/doc-flow';

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

  it('listarProjetos() sends params', () => {
    service.listarProjetos({ nome: 'a', page: 2, size: 5 }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/projetos`);
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], totalItems: 0 });
  });

  it('projetos() caches and replays on second call', () => {
    service.projetos().subscribe();
    const first = http.expectOne(r => r.url === `${BASE}/projetos`);
    first.flush({ items: [{ id: 'p1' } as Projeto], totalItems: 1 });

    service.projetos().subscribe(items => expect(items[0].id).toBe('p1'));
    http.expectNone(r => r.url === `${BASE}/projetos`);
  });

  it('projeto(id) hits /projetos/:id', () => {
    service.projeto('p1').subscribe();
    http.expectOne(`${BASE}/projetos/p1`).flush({} as Projeto);
  });

  it('salvarProjeto() POSTs without id and invalidates cache', () => {
    service.projetos().subscribe();
    http.expectOne(r => r.url === `${BASE}/projetos`).flush({ items: [], totalItems: 0 });

    service.salvarProjeto({ nome: 'X' }).subscribe();
    const req = http.expectOne(`${BASE}/projetos`);
    expect(req.request.method).toBe('POST');
    req.flush({} as Projeto);

    service.projetos().subscribe();
    http.expectOne(r => r.url === `${BASE}/projetos`).flush({ items: [], totalItems: 0 });
  });

  it('salvarProjeto() PUTs when id is provided', () => {
    service.salvarProjeto({ nome: 'X' }, 'p1').subscribe();
    const req = http.expectOne(`${BASE}/projetos/p1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as Projeto);
  });

  it('excluirProjeto() DELETEs e invalida o cache', () => {
    service.projetos().subscribe();
    http.expectOne(r => r.url === `${BASE}/projetos`).flush({ items: [], totalItems: 0 });

    service.excluirProjeto('p1').subscribe();
    const req = http.expectOne(`${BASE}/projetos/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    service.projetos().subscribe();
    http.expectOne(r => r.url === `${BASE}/projetos`).flush({ items: [], totalItems: 0 });
  });
});
