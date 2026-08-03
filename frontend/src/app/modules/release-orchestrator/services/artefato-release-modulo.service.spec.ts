import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ArtefatoReleaseModuloService } from './artefato-release-modulo.service';

const RELEASE_ID = 'rel-1';
const MODULO_ID = 'mod-1';
const BASE = `/api/v1/release-orchestrator/releases/${RELEASE_ID}/modulos/${MODULO_ID}/artefatos`;

describe('ArtefatoReleaseModuloService', () => {
  let service: ArtefatoReleaseModuloService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ArtefatoReleaseModuloService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ArtefatoReleaseModuloService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() faz GET na rota nested', () => {
    service.listar(RELEASE_ID, MODULO_ID).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.url).toBe(BASE);
    req.flush([]);
  });

  it('upload() envia FormData com file + observacao', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'nexus.war', {
      type: 'application/octet-stream',
    });
    service.upload(RELEASE_ID, MODULO_ID, file, 'primeira tentativa').subscribe();

    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body instanceof FormData).toBe(true);
    const fd = req.request.body as FormData;
    expect(fd.get('file')).toBeTruthy();
    expect(fd.get('observacao')).toBe('primeira tentativa');
    req.flush({});
  });

  it('upload() omite observacao quando vazia', () => {
    const file = new File([new Uint8Array([1])], 'x.war', { type: 'application/octet-stream' });
    service.upload(RELEASE_ID, MODULO_ID, file).subscribe();

    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    const fd = req.request.body as FormData;
    expect(fd.get('observacao')).toBeNull();
    req.flush({});
  });

  it('baixar() faz GET com responseType blob', () => {
    service.baixar(RELEASE_ID, MODULO_ID, 'art-1').subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === `${BASE}/art-1/download`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('downloadUrl() devolve URL completa', () => {
    expect(service.downloadUrl(RELEASE_ID, MODULO_ID, 'art-1'))
      .toBe(`${BASE}/art-1/download`);
  });

  it('excluir() faz DELETE no artefato', () => {
    service.excluir(RELEASE_ID, MODULO_ID, 'art-1').subscribe();
    const req = http.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/art-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
