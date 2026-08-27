import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HostService } from './host.service';

const BASE = '/api/v1/release-orchestrator/hosts';

describe('HostService', () => {
  let service: HostService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HostService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HostService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() monta query com filtros e paginação', () => {
    service.listar(2, 10, 'srv', true, 'LINUX', true).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('q')).toBe('srv');
    expect(req.request.params.get('ativo')).toBe('true');
    expect(req.request.params.get('sistemaOperacional')).toBe('LINUX');
    expect(req.request.params.get('dockerDisponivel')).toBe('true');
    req.flush({ items: [], totalItems: 0, page: 2, pageSize: 10 });
  });

  it('listar() devolve items vazio quando backend envia null', () => {
    let result: { items: unknown[] } = { items: ['placeholder'] };
    service.listar().subscribe(r => (result = r));
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    req.flush({ items: null, totalItems: 0, page: 1, pageSize: 20 });
    expect(result.items).toEqual([]);
  });

  it('buscar() faz GET na rota do recurso', () => {
    service.buscar('host-1').subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === `${BASE}/host-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('criar() POSTa o body', () => {
    service
      .criar({ codigo: 'SRV-01', nome: 'Srv', hostname: 'srv-01', sistemaOperacional: 'LINUX' })
      .subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body.codigo).toBe('SRV-01');
    req.flush({});
  });

  it('atualizar() faz PUT', () => {
    service
      .atualizar('host-1', { codigo: 'SRV-01', nome: 'X', hostname: 'x', sistemaOperacional: 'WINDOWS' })
      .subscribe();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/host-1`);
    expect(req.request.body.sistemaOperacional).toBe('WINDOWS');
    req.flush({});
  });

  it('alterarStatus() faz PATCH com { ativo }', () => {
    service.alterarStatus('host-1', false).subscribe();
    const req = http.expectOne(r => r.method === 'PATCH' && r.url === `${BASE}/host-1/status`);
    expect(req.request.body).toEqual({ ativo: false });
    req.flush({});
  });

  it('excluir() faz DELETE', () => {
    service.excluir('host-1').subscribe();
    const req = http.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/host-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
