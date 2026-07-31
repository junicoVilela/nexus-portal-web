import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClienteService } from './cliente.service';
import { Cliente } from '../models/cliente.model';

const BASE = '/api/doc-flow';
const GENERATED_BASE = '/api/v1/docflow';
const PREVIEW_TOKENS_BASE = '/api/v1/preview-tokens';

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

  it('listarClientes() sends paging + sort params', fakeAsync(() => {
    service.listarClientes({ nome: 'a', page: 1, size: 10, sort: 'nome', dir: 'ASC' }).subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/clientes`));
    expect(req.request.url).toContain('nome=a');
    expect(req.request.url).toContain('page=1');
    expect(req.request.url).toContain('sort=nome');
    req.flush({ items: [], totalItems: 0 });
    tick();
  }));

  it('clientes() maps PageResult to items', fakeAsync(() => {
    let list: Cliente[] = [];
    service.clientes().subscribe(items => (list = items));
    tick();
    http.expectOne(r => r.url.startsWith(`${GENERATED_BASE}/clientes`)).flush({ items: [{}, {}], totalItems: 2 });
    tick();
    expect(list.length).toBe(2);
  }));

  it('cliente(id) hits /clientes/:id', fakeAsync(() => {
    service.cliente('c1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/clientes/c1`).flush({} as Cliente);
    tick();
  }));

  it('salvarCliente() POSTs without id', fakeAsync(() => {
    service.salvarCliente({ nome: 'X' }).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/clientes`);
    expect(req.request.method).toBe('POST');
    req.flush({} as Cliente);
    tick();
  }));

  it('salvarCliente() PUTs when id is provided', fakeAsync(() => {
    service.salvarCliente({ nome: 'X' }, 'c1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/clientes/c1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as Cliente);
    tick();
  }));

  it('excluirCliente() DELETEs /clientes/:id', fakeAsync(() => {
    service.excluirCliente('c1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/clientes/c1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));

  it('vinculosCliente() hits /:id/vinculos', fakeAsync(() => {
    service.vinculosCliente('c1').subscribe();
    tick();
    http.expectOne(`${GENERATED_BASE}/clientes/c1/vinculos`).flush({ projetoIds: [], moduloIds: [], paginaIds: [] });
    tick();
  }));

  it('salvarProjetosCliente() PUTs ids array', fakeAsync(() => {
    service.salvarProjetosCliente('c1', ['p1', 'p2']).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/clientes/c1/projetos`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ projetoIds: ['p1', 'p2'] });
    req.flush(null);
    tick();
  }));

  it('copiarVinculosCliente() POSTs origemClienteId', fakeAsync(() => {
    service.copiarVinculosCliente('c1', 'c2').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/clientes/c1/copiar-vinculos`);
    expect(req.request.body).toEqual({ origemClienteId: 'c2' });
    req.flush(null);
    tick();
  }));

  it('uploadLogoCliente() POSTs multipart with file', fakeAsync(() => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    service.uploadLogoCliente('c1', file).subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/clientes/c1/logo`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    tick();
  }));

  it('removerLogoCliente() DELETEs /logo', fakeAsync(() => {
    service.removerLogoCliente('c1').subscribe();
    tick();
    const req = http.expectOne(`${GENERATED_BASE}/clientes/c1/logo`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));

  it('logoUrlCliente() returns canonical URL', () => {
    expect(service.logoUrlCliente('c1')).toBe(`${BASE}/clientes/c1/logo`);
  });

  it('gerarPreviewToken() sets clienteId and horasValidade params', fakeAsync(() => {
    service.gerarPreviewToken('c1', 48).subscribe();
    tick();
    const req = http.expectOne(r => r.url.startsWith(`${PREVIEW_TOKENS_BASE}?`));
    expect(req.request.url).toContain('clienteId=c1');
    expect(req.request.url).toContain('horasValidade=48');
    req.flush({ token: 'abc', expiresAt: '2026-06-12' });
    tick();
  }));

  it('revogarPreviewToken() DELETEs /preview-tokens/:id', fakeAsync(() => {
    service.revogarPreviewToken('t1').subscribe();
    tick();
    const req = http.expectOne(`${PREVIEW_TOKENS_BASE}/t1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
  }));
});
