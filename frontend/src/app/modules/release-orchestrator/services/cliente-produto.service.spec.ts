import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ClienteProdutoService } from './cliente-produto.service';

const BASE = '/api/v1/release-orchestrator/clientes/c1/produtos';

describe('ClienteProdutoService', () => {
  let service: ClienteProdutoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClienteProdutoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClienteProdutoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() GET produtos do cliente', () => {
    service.listar('c1').subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('contratar() POST produto e ambiente', () => {
    service.contratar('c1', { produtoId: 'p1', ambiente: 'HOM' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ produtoId: 'p1', ambiente: 'HOM' });
    req.flush({ id: 'cp1' });
  });

  it('salvarModulo() PUT módulo contratado', () => {
    service.salvarModulo('c1', 'cp1', 'm1', { ativo: true }).subscribe();
    const req = http.expectOne(`${BASE}/cp1/modulos/m1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ ativo: true });
    req.flush({ id: 'cpm1' });
  });
});
