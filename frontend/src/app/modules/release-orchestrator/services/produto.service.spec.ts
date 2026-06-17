import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProdutoService } from './produto.service';
import { Produto, ProdutoForm } from '../models/produto.model';

const BASE = '/api/v1/release-orchestrator/produtos';

describe('ProdutoService', () => {
  let service: ProdutoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProdutoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProdutoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() builds query string with paging/filters', () => {
    service.listar(2, 10, 'foo', true).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('nome')).toBe('foo');
    expect(req.request.params.get('ativo')).toBe('true');
    req.flush({ items: [], totalItems: 0, page: 2, pageSize: 10 });
  });

  it('listar() defaults items to [] when API omits it', done => {
    service.listar().subscribe(res => {
      expect(res.items).toEqual([]);
      done();
    });
    const req = http.expectOne(r => r.url === BASE);
    req.flush({ totalItems: 0 });
  });

  it('listarTodos() caches the second call', () => {
    service.listarTodos().subscribe();
    const first = http.expectOne(r => r.url === BASE);
    first.flush({ items: [], totalItems: 0 });

    service.listarTodos().subscribe();
    http.expectNone(r => r.url === BASE);
  });

  it('invalidarCache() forces a new HTTP request next time', () => {
    service.listarTodos().subscribe();
    http.expectOne(r => r.url === BASE).flush({ items: [], totalItems: 0 });

    service.invalidarCache();
    service.listarTodos().subscribe();
    http.expectOne(r => r.url === BASE).flush({ items: [], totalItems: 0 });
  });

  it('buscarPorId() hits /produtos/:id', () => {
    service.buscarPorId('abc').subscribe();
    const req = http.expectOne(`${BASE}/abc`);
    expect(req.request.method).toBe('GET');
    req.flush({} as Produto);
  });

  it('criar() POSTs and invalidates cache', () => {
    const form: ProdutoForm = { nome: 'X', sigla: 'X', cor: '#000', ativo: true };
    spyOn(service, 'invalidarCache').and.callThrough();
    service.criar(form).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(form);
    req.flush({} as Produto);
    expect(service.invalidarCache).toHaveBeenCalled();
  });

  it('atualizar() PUTs the form to /produtos/:id', () => {
    const form: ProdutoForm = { nome: 'Y', sigla: 'Y', cor: '#fff', ativo: false };
    service.atualizar('id-1', form).subscribe();
    const req = http.expectOne(`${BASE}/id-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(form);
    req.flush({} as Produto);
  });

  it('alterarStatus() PATCHes ativo', () => {
    service.alterarStatus('id-2', false).subscribe();
    const req = http.expectOne(`${BASE}/id-2/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ativo: false });
    req.flush({} as Produto);
  });

  it('excluir() DELETEs /produtos/:id', () => {
    service.excluir('id-3').subscribe();
    const req = http.expectOne(`${BASE}/id-3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('uploadLogo() POSTs multipart with key "logo"', () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    service.uploadLogo('id-4', file).subscribe();
    const req = http.expectOne(`${BASE}/id-4/logo`);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.has('logo')).toBe(true);
    req.flush({ logoUrl: '/x.png' });
  });
});
