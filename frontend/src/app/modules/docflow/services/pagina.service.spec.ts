import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaginaService } from './pagina.service';
import { Pagina, PaginaAnexo } from '../models/pagina.model';

const BASE = '/api/doc-flow';

describe('PaginaService', () => {
  let service: PaginaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaginaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPaginas() sends filters as query params', () => {
    service.listarPaginas({ busca: 'q', moduloId: 'm1', status: 'PUBLICADO', page: 1, size: 10 }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/paginas`);
    expect(req.request.params.get('busca')).toBe('q');
    expect(req.request.params.get('moduloId')).toBe('m1');
    expect(req.request.params.get('status')).toBe('PUBLICADO');
    req.flush({ items: [], totalItems: 0 });
  });

  it('pagina(id) hits /paginas/:id', () => {
    service.pagina('pg1').subscribe();
    http.expectOne(`${BASE}/paginas/pg1`).flush({} as Pagina);
  });

  it('salvarPagina() POSTs without id and PUTs with id', () => {
    service.salvarPagina({ titulo: 'a' }).subscribe();
    expect(http.expectOne(`${BASE}/paginas`).request.method).toBe('POST');
    service.salvarPagina({ titulo: 'a' }, 'pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1`).request.method).toBe('PUT');
  });

  it('action endpoints POST to /paginas/:id/<acao>', () => {
    service.salvarRascunho('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/salvar-rascunho`).request.method).toBe('POST');
    service.publicarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/publicar`).request.method).toBe('POST');
    service.enviarRevisaoPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/enviar-revisao`).request.method).toBe('POST');
    service.aprovarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/aprovar`).request.method).toBe('POST');
    service.arquivarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/arquivar`).request.method).toBe('POST');
    service.duplicarPagina('pg1').subscribe();
    expect(http.expectOne(`${BASE}/paginas/pg1/duplicar`).request.method).toBe('POST');
  });

  it('listarRevisoesPagina() sends paging + sort params', () => {
    service.listarRevisoesPagina('pg1', 2, 5, 'numero', 'DESC').subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/paginas/pg1/revisoes`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('sort')).toBe('numero');
    expect(req.request.params.get('dir')).toBe('DESC');
    req.flush({ items: [], totalItems: 0 });
  });

  it('anexosPagina() returns array from /anexos', done => {
    service.anexosPagina('pg1').subscribe(list => {
      expect(list.length).toBe(2);
      done();
    });
    http.expectOne(`${BASE}/paginas/pg1/anexos`).flush([{}, {}] as PaginaAnexo[]);
  });

  it('anexarPagina() POSTs FormData with key "file"', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.anexarPagina('pg1', file).subscribe();
    const req = http.expectOne(`${BASE}/paginas/pg1/anexos`);
    const body = req.request.body as FormData;
    expect(body.has('file')).toBe(true);
    req.flush({} as PaginaAnexo);
  });

  it('excluirAnexoPagina() DELETEs /paginas/:id/anexos/:anexoId', () => {
    service.excluirAnexoPagina('pg1', 'a1').subscribe();
    const req = http.expectOne(`${BASE}/paginas/pg1/anexos/a1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('downloadAnexoUrl() prepends BASE to anexo.downloadUrl', () => {
    expect(service.downloadAnexoUrl({ downloadUrl: '/x.png' } as PaginaAnexo)).toBe(`${BASE}/x.png`);
  });

  it('resumoPaginasPorStatusGlobal() hits /paginas/resumo-por-status', () => {
    service.resumoPaginasPorStatusGlobal().subscribe();
    http.expectOne(`${BASE}/paginas/resumo-por-status`).flush({});
  });

  it('reordenarPaginas() POSTs ids array', () => {
    service.reordenarPaginas(['a', 'b']).subscribe();
    const req = http.expectOne(`${BASE}/paginas/reordenar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ paginaIds: ['a', 'b'] });
    req.flush(null);
  });
});
