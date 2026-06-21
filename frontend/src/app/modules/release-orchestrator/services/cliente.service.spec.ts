import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ClienteService } from './cliente.service';

const BASE = '/api/v1/release-orchestrator/clientes';

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

  it('listar() monta query com q/ativo/paginação', () => {
    service.listar(2, 10, 'acme', true).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('q')).toBe('acme');
    expect(req.request.params.get('ativo')).toBe('true');
    req.flush({ items: [], totalItems: 0, page: 2, pageSize: 10 });
  });

  it('listar() devolve items vazio quando backend envia null', async () => {
    let result: { items: unknown[] } = { items: ['placeholder'] };
    service.listar().subscribe(r => (result = r));
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    req.flush({ items: null, totalItems: 0, page: 1, pageSize: 20 });
    expect(result.items).toEqual([]);
  });

  it('buscar() faz GET na rota do recurso', () => {
    service.buscar('cli-1').subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === `${BASE}/cli-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('criar() POSTa o body', () => {
    service.criar({ nome: 'ACME', sigla: 'ACME', ambientePadrao: 'PROD' } as any).subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body).toEqual({ nome: 'ACME', sigla: 'ACME', ambientePadrao: 'PROD' });
    req.flush({});
  });

  it('atualizar() faz PUT', () => {
    service.atualizar('cli-1', { nome: 'X', sigla: 'X', ambientePadrao: 'HOM' } as any).subscribe();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/cli-1`);
    expect(req.request.body.ambientePadrao).toBe('HOM');
    req.flush({});
  });

  it('alterarStatus() faz PATCH com { ativo }', () => {
    service.alterarStatus('cli-1', false).subscribe();
    const req = http.expectOne(r => r.method === 'PATCH' && r.url === `${BASE}/cli-1/status`);
    expect(req.request.body).toEqual({ ativo: false });
    req.flush({});
  });

  it('excluir() faz DELETE', () => {
    service.excluir('cli-1').subscribe();
    const req = http.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/cli-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
