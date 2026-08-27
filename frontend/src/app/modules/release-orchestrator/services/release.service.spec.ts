import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReleaseService, versaoPortalDaTag } from './release.service';
import { Release } from '../models/release.model';

const BASE = '/api/v1/release-orchestrator/releases';

describe('ReleaseService', () => {
  let service: ReleaseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReleaseService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReleaseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() sends all filters as query params', () => {
    service
      .listar({
        produtoId: 'p1',
        status: 'PUBLICADA',
        tipo: 'MAJOR',
        q: 'foo',
        dataPrevistaInicio: '2026-01-01',
        page: 2,
        size: 10,
      })
      .subscribe();
    const req = http.expectOne(r => r.url === BASE);
    expect(req.request.params.get('produtoId')).toBe('p1');
    expect(req.request.params.get('status')).toBe('PUBLICADA');
    expect(req.request.params.get('q')).toBe('foo');
    expect(req.request.params.get('dataPrevistaInicio')).toBe('2026-01-01');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], totalItems: 0 });
  });

  it('listar() defaults items to [] when API omits it', done => {
    service.listar({}).subscribe(res => {
      expect(res.items).toEqual([]);
      done();
    });
    http.expectOne(r => r.url === BASE).flush({ totalItems: 0 });
  });

  it('buscarPorId() hits /releases/:id', () => {
    service.buscarPorId('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1`);
    expect(req.request.method).toBe('GET');
    req.flush({} as Release);
  });

  it('criar() POSTs form to /releases', () => {
    service.criar({ produtoId: 'p1', versao: '1.0', titulo: 't', tipo: 'MAJOR' } as never).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({} as Release);
  });

  it('atualizar() PUTs to /releases/:id', () => {
    service.atualizar('r1', {} as never).subscribe();
    const req = http.expectOne(`${BASE}/r1`);
    expect(req.request.method).toBe('PUT');
    req.flush({} as Release);
  });

  it('alterarStatus() PATCHes status with observacao', () => {
    service.alterarStatus('r1', 'EM_REVISAO', 'pronto').subscribe();
    const req = http.expectOne(`${BASE}/r1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'EM_REVISAO', observacao: 'pronto' });
    req.flush({} as Release);
  });

  it('publicar() POSTs empty body to /publicar', () => {
    service.publicar('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1/publicar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({} as Release);
  });

  it('cancelar() POSTs motivo to /cancelar', () => {
    service.cancelar('r1', 'inválida').subscribe();
    const req = http.expectOne(`${BASE}/r1/cancelar`);
    expect(req.request.body).toEqual({ motivo: 'inválida' });
    req.flush({} as Release);
  });

  it('duplicar() POSTs to /duplicar', () => {
    service.duplicar('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1/duplicar`);
    expect(req.request.method).toBe('POST');
    req.flush({} as Release);
  });

  it('excluir() DELETEs /releases/:id', () => {
    service.excluir('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('listarHistorico() returns [] when API responds null', done => {
    service.listarHistorico('r1').subscribe(res => {
      expect(res).toEqual([]);
      done();
    });
    http.expectOne(`${BASE}/r1/historico`).flush(null);
  });

  it('listarManifestos() GET /manifestos', () => {
    service.listarManifestos('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1/manifestos`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('salvarManifesto() PUT /manifestos', () => {
    service.salvarManifesto('r1', { tipoImplantacao: 'DOCKER_PULL', imagemRef: 'rpa:1' }).subscribe();
    const req = http.expectOne(`${BASE}/r1/manifestos`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.imagemRef).toBe('rpa:1');
    req.flush({});
  });

  it('listarDisponiveisDeploy() consulta Git + em andamento', () => {
    service.listarDisponiveisDeploy('p1').subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === `${BASE}/disponiveis-deploy`);
    expect(req.request.params.get('produtoId')).toBe('p1');
    req.flush([]);
  });

  it('listarFontesBuild() GET /fontes-build', () => {
    service.listarFontesBuild('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1/fontes-build`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Silent-Error')).toBe('1');
    req.flush({ tags: [] });
  });

  it('dispararBuild() POST /disparar-build com origem e tag', () => {
    service.dispararBuild('r1', { origem: 'TAG_ESPECIFICA', tag: 'v5.0.0' }).subscribe();
    const req = http.expectOne(`${BASE}/r1/disparar-build`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ origem: 'TAG_ESPECIFICA', tag: 'v5.0.0' });
    req.flush({ tag: 'v5.0.0', versao: '5.0.0' });
  });
});

describe('versaoPortalDaTag', () => {
  it('converts branch v5/main to v5-main', () => {
    expect(versaoPortalDaTag('v5/main')).toBe('v5-main');
  });

  it('strips leading v from tags', () => {
    expect(versaoPortalDaTag('v5.4.2')).toBe('5.4.2');
    expect(versaoPortalDaTag('release/v5.4.1')).toBe('5.4.1');
  });
});
