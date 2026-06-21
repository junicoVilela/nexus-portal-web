import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProximaEntregaService } from './proxima-entrega.service';

const BASE = '/api/v1/release-orchestrator/proximas-entregas';

describe('ProximaEntregaService', () => {
  let service: ProximaEntregaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProximaEntregaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProximaEntregaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() monta filtros + paginação', () => {
    service
      .listar(1, 20, {
        clienteId: 'cli-1',
        produtoId: 'prod-1',
        status: 'AGENDADA',
        dataDe: '2026-06-01',
        dataAte: '2026-06-30',
      })
      .subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.params.get('clienteId')).toBe('cli-1');
    expect(req.request.params.get('produtoId')).toBe('prod-1');
    expect(req.request.params.get('status')).toBe('AGENDADA');
    expect(req.request.params.get('dataDe')).toBe('2026-06-01');
    expect(req.request.params.get('dataAte')).toBe('2026-06-30');
    req.flush({ items: [], totalItems: 0, page: 1, pageSize: 20 });
  });

  it('listar() default sem filtros só envia paginação', () => {
    service.listar().subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.params.get('clienteId')).toBeNull();
    req.flush({ items: [], totalItems: 0, page: 1, pageSize: 20 });
  });

  it('criar() POSTa o body', () => {
    service
      .criar({
        clienteId: 'cli-1',
        produtoId: 'prod-1',
        dataPrevista: '2026-07-15',
        ambiente: 'PROD',
        prioridade: 'ALTA',
      })
      .subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body.prioridade).toBe('ALTA');
    req.flush({});
  });

  it('atualizar() faz PUT', () => {
    service
      .atualizar('pe-1', {
        clienteId: 'cli-1',
        produtoId: 'prod-1',
        dataPrevista: '2026-07-15',
        ambiente: 'HOM',
        prioridade: 'MEDIA',
      })
      .subscribe();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/pe-1`);
    expect(req.request.body.ambiente).toBe('HOM');
    req.flush({});
  });

  it('alterarStatus() faz PATCH com { status }', () => {
    service.alterarStatus('pe-1', 'AGENDADA').subscribe();
    const req = http.expectOne(r => r.method === 'PATCH' && r.url === `${BASE}/pe-1/status`);
    expect(req.request.body).toEqual({ status: 'AGENDADA' });
    req.flush({});
  });

  it('excluir() faz DELETE', () => {
    service.excluir('pe-1').subscribe();
    const req = http.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/pe-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
