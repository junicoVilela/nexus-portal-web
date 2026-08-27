import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DeployInstalacaoService } from './deploy-instalacao.service';

const BASE = '/api/v1/release-orchestrator/deploys';

describe('DeployInstalacaoService', () => {
  let service: DeployInstalacaoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeployInstalacaoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DeployInstalacaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('preview() consulta release e instalação', () => {
    service.preview('r1', 'i1').subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === `${BASE}/preview`);
    expect(req.request.params.get('releaseId')).toBe('r1');
    expect(req.request.params.get('instalacaoId')).toBe('i1');
    req.flush({});
  });

  it('executar() POST com releaseId e instalacaoId', () => {
    service.executar({ releaseId: 'r1', instalacaoId: 'i1' }).subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body).toEqual({ releaseId: 'r1', instalacaoId: 'i1' });
    req.flush({});
  });

  it('executarLote() POST /lote', () => {
    service.executarLote('e1', 'REAL').subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === `${BASE}/lote`);
    expect(req.request.body).toEqual({ entregaId: 'e1', modo: 'REAL', forcar: false });
    req.flush({ itens: null, concluidos: 0, falhas: 0, ignorados: 0 });
  });

  it('listar() devolve items vazio quando backend envia null', () => {
    let result: { items: unknown[] } = { items: ['x'] };
    service.listar(1, 10, { instalacaoId: 'i1' }).subscribe(r => (result = r));
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.params.get('instalacaoId')).toBe('i1');
    req.flush({ items: null, totalItems: 0, page: 1, pageSize: 10 });
    expect(result.items).toEqual([]);
  });
});
