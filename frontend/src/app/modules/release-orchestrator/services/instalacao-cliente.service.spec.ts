import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { InstalacaoClienteService } from './instalacao-cliente.service';

const BASE = '/api/v1/release-orchestrator/instalacoes';

describe('InstalacaoClienteService', () => {
  let service: InstalacaoClienteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InstalacaoClienteService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InstalacaoClienteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() monta query com filtros e paginação', () => {
    service.listar(2, 10, 'acme', 'c1', 'h1', 'p1', 'DOCKER_PULL', 'ATIVA', 'PROD').subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('tipoImplantacao')).toBe('DOCKER_PULL');
    expect(req.request.params.get('status')).toBe('ATIVA');
    expect(req.request.params.get('ambiente')).toBe('PROD');
    req.flush({ items: [], totalItems: 0, page: 2, pageSize: 10 });
  });

  it('listar() devolve items vazio quando backend envia null', () => {
    let result: { items: unknown[] } = { items: ['placeholder'] };
    service.listar().subscribe(r => (result = r));
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    req.flush({ items: null, totalItems: 0, page: 1, pageSize: 20 });
    expect(result.items).toEqual([]);
  });

  it('criar() POSTa o body', () => {
    service
      .criar({
        codigo: 'ACME-RPA-01',
        nome: 'RPA ACME',
        clienteId: 'c1',
        hostId: 'h1',
        produtoId: 'p1',
        tipoImplantacao: 'DOCKER_PULL',
        ambiente: 'PROD',
      })
      .subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body.tipoImplantacao).toBe('DOCKER_PULL');
    req.flush({});
  });

  it('alterarStatus() faz PATCH com { status }', () => {
    service.alterarStatus('i1', 'INATIVA').subscribe();
    const req = http.expectOne(r => r.method === 'PATCH' && r.url === `${BASE}/i1/status`);
    expect(req.request.body).toEqual({ status: 'INATIVA' });
    req.flush({});
  });

  it('registrarHealth() faz PATCH com health e versão', () => {
    service.registrarHealth('i1', { health: 'SAUDAVEL', versaoAtual: '1.4.0' }).subscribe();
    const req = http.expectOne(r => r.method === 'PATCH' && r.url === `${BASE}/i1/health`);
    expect(req.request.body).toEqual({ health: 'SAUDAVEL', versaoAtual: '1.4.0' });
    req.flush({});
  });

  it('iniciar() POST /start com modo REAL', () => {
    service.iniciar('i1').subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === `${BASE}/i1/start`);
    expect(req.request.body).toEqual({ modo: 'REAL' });
    req.flush({});
  });

  it('parar() POST /stop com modo REAL', () => {
    service.parar('i1', 'DRY_RUN').subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === `${BASE}/i1/stop`);
    expect(req.request.body).toEqual({ modo: 'DRY_RUN' });
    req.flush({});
  });

  it('sugerirPortas() consulta o host informado', () => {
    service.sugerirPortas('h1', 'i1').subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === `${BASE}/portas-sugeridas`);
    expect(req.request.params.get('hostId')).toBe('h1');
    expect(req.request.params.get('instalacaoId')).toBe('i1');
    req.flush({ backend: [8081], frontend: [4000] });
  });

  it('listarFontesVersao() GET /fontes-versao', () => {
    service.listarFontesVersao('i1').subscribe();
    const req = http.expectOne(`${BASE}/i1/fontes-versao`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Silent-Error')).toBe('1');
    req.flush({ tags: [] });
  });

  it('resolverVersao() POST origem e tag', () => {
    service.resolverVersao('i1', { origem: 'TAG_ESPECIFICA', tag: 'v5.0.0' }).subscribe();
    const req = http.expectOne(`${BASE}/i1/resolver-versao`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ origem: 'TAG_ESPECIFICA', tag: 'v5.0.0' });
    req.flush({ releaseId: 'r1', versao: '5.0.0' });
  });

  it('dispararBuild() POST /disparar-build', () => {
    service.dispararBuild('i1', { origem: 'ULTIMA_GERADA' }).subscribe();
    const req = http.expectOne(`${BASE}/i1/disparar-build`);
    expect(req.request.body).toEqual({ origem: 'ULTIMA_GERADA' });
    req.flush({ tag: 'v4.9.0' });
  });

  it('dispararBuild() envia alvoIds dos jobs marcados', () => {
    service
      .dispararBuild('i1', { origem: 'RELEASE_ATUAL', alvoIds: ['produto:ld', 'produto:cr'] })
      .subscribe();
    const req = http.expectOne(`${BASE}/i1/disparar-build`);
    expect(req.request.body).toEqual({
      origem: 'RELEASE_ATUAL',
      alvoIds: ['produto:ld', 'produto:cr'],
    });
    req.flush({ tag: 'v5/main', jobs: [] });
  });
});
