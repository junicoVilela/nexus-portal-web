import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { ConfiguracaoService } from './configuracao.service';

const GENERATED_BASE = '/api/v1/docflow';
const PNG_TINY = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'logo.png', {
  type: 'image/png',
});

describe('ConfiguracaoService', () => {
  let service: ConfiguracaoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfiguracaoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfiguracaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('logoEmpresaUrl vazio quando não há logo', () => {
    expect(service.logoEmpresaUrl()).toBe('');
  });

  it('logoEmpresaExiste() retorna false quando ainda não há logo', fakeAsync(async () => {
    const promise = firstValueFrom(service.logoEmpresaExiste());
    tick();
    const req = httpMock.expectOne(`${GENERATED_BASE}/empresa/logo`);
    req.flush(null, { status: 204, statusText: 'No Content' });
    tick();
    expect(await promise).toBe(false);
    expect(service.logoEmpresaUrl()).toBe('');
  }));

  it('logoEmpresaExiste() mantém fallback para falhas da API', fakeAsync(async () => {
    const promise = firstValueFrom(service.logoEmpresaExiste());
    tick();
    const req = httpMock.expectOne(`${GENERATED_BASE}/empresa/logo`);
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    tick();
    expect(await promise).toBe(false);
    expect(service.logoEmpresaUrl()).toBe('');
  }));

  it('uploadLogoEmpresa() POST multipart e expõe URL do logo', fakeAsync(async () => {
    const promise = firstValueFrom(service.uploadLogoEmpresa(PNG_TINY));
    tick();
    const req = httpMock.expectOne(`${GENERATED_BASE}/empresa/logo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(null, { status: 204, statusText: 'No Content' });
    tick();
    await promise;

    expect(service.logoEmpresaUrl()).toContain(`${environment.apiUrl}/empresa/logo?v=`);
  }));

  it('removerLogoEmpresa() DELETE limpa URL', fakeAsync(async () => {
    const uploadPromise = firstValueFrom(service.uploadLogoEmpresa(PNG_TINY));
    tick();
    httpMock
      .expectOne(`${GENERATED_BASE}/empresa/logo`)
      .flush(null, { status: 204, statusText: 'No Content' });
    tick();
    await uploadPromise;

    const removePromise = firstValueFrom(service.removerLogoEmpresa());
    tick();
    const req = httpMock.expectOne(`${GENERATED_BASE}/empresa/logo`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    tick();
    await removePromise;

    expect(service.logoEmpresaUrl()).toBe('');
  }));
});
