import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ReleaseModuloVersaoService } from './release-modulo-versao.service';

const RELEASE_ID = 'rel-1';
const BASE = `/api/v1/release-orchestrator/releases/${RELEASE_ID}/modulos-versao`;

describe('ReleaseModuloVersaoService', () => {
  let service: ReleaseModuloVersaoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReleaseModuloVersaoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReleaseModuloVersaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() faz GET na rota nested', () => {
    service.listar(RELEASE_ID).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.url).toBe(BASE);
    req.flush([]);
  });

  it('salvar() faz PUT no slot do módulo com { versao }', () => {
    service.salvar(RELEASE_ID, 'mod-1', '1.5.0').subscribe();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/mod-1`);
    expect(req.request.body).toEqual({ versao: '1.5.0' });
    req.flush({});
  });

  it('remover() faz DELETE no slot do módulo', () => {
    service.remover(RELEASE_ID, 'mod-1').subscribe();
    const req = http.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/mod-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
