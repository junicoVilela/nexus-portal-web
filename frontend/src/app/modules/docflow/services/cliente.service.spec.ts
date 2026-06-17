import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClienteService } from './cliente.service';
import { Cliente } from '../models/cliente.model';

const BASE = '/api/doc-flow';

describe('ClienteService', () => {
  let service: ClienteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClienteService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClienteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarClientes() sends paging + sort params', () => {
    service.listarClientes({ nome: 'a', page: 1, size: 10, sort: 'nome', dir: 'ASC' }).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/clientes`);
    expect(req.request.params.get('nome')).toBe('a');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('sort')).toBe('nome');
    req.flush({ items: [], totalItems: 0 });
  });

  it('clientes() maps PageResult to items', done => {
    service.clientes().subscribe(list => {
      expect(list.length).toBe(2);
      done();
    });
    http.expectOne(r => r.url === `${BASE}/clientes`).flush({ items: [{}, {}], totalItems: 2 });
  });

  it('cliente(id) hits /clientes/:id', () => {
    service.cliente('c1').subscribe();
    http.expectOne(`${BASE}/clientes/c1`).flush({} as Cliente);
  });

  it('salvarCliente() POSTs without id', () => {
    service.salvarCliente({ nome: 'X' }).subscribe();
    const req = http.expectOne(`${BASE}/clientes`);
    expect(req.request.method).toBe('POST');
    req.flush({} as Cliente);
  });

  it('salvarCliente() PUTs when id is provided', () => {
    service.salvarCliente({ nome: 'X' }, 'c1').subscribe();
    const req = http.expectOne(`${BASE}/clientes/c1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as Cliente);
  });

  it('vinculosCliente() hits /:id/vinculos', () => {
    service.vinculosCliente('c1').subscribe();
    http.expectOne(`${BASE}/clientes/c1/vinculos`).flush({ projetoIds: [], moduloIds: [], paginaIds: [] });
  });

  it('salvarProjetosCliente() PUTs ids array', () => {
    service.salvarProjetosCliente('c1', ['p1', 'p2']).subscribe();
    const req = http.expectOne(`${BASE}/clientes/c1/projetos`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ projetoIds: ['p1', 'p2'] });
    req.flush(null);
  });

  it('copiarVinculosCliente() POSTs origemClienteId', () => {
    service.copiarVinculosCliente('c1', 'c2').subscribe();
    const req = http.expectOne(`${BASE}/clientes/c1/copiar-vinculos`);
    expect(req.request.body).toEqual({ origemClienteId: 'c2' });
    req.flush(null);
  });

  it('uploadLogoCliente() POSTs FormData with key "file"', () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    service.uploadLogoCliente('c1', file).subscribe();
    const req = http.expectOne(`${BASE}/clientes/c1/logo`);
    const body = req.request.body as FormData;
    expect(body.has('file')).toBe(true);
    req.flush(null);
  });

  it('removerLogoCliente() DELETEs /logo', () => {
    service.removerLogoCliente('c1').subscribe();
    const req = http.expectOne(`${BASE}/clientes/c1/logo`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('logoUrlCliente() returns canonical URL', () => {
    expect(service.logoUrlCliente('c1')).toBe(`${BASE}/clientes/c1/logo`);
  });

  it('gerarPreviewToken() sets clienteId and horasValidade params', () => {
    service.gerarPreviewToken('c1', 48).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/preview-tokens`);
    expect(req.request.params.get('clienteId')).toBe('c1');
    expect(req.request.params.get('horasValidade')).toBe('48');
    req.flush({ token: 'abc', expiresAt: '2026-06-12' });
  });

  it('revogarPreviewToken() DELETEs /preview-tokens/:id', () => {
    service.revogarPreviewToken('t1').subscribe();
    const req = http.expectOne(`${BASE}/preview-tokens/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
