import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { ConfiguracaoService } from './configuracao.service';

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

  it('logoEmpresaExiste() retorna false quando ainda não há logo', async () => {
    const promise = firstValueFrom(service.logoEmpresaExiste());
    const req = httpMock.expectOne(`${environment.apiUrl}/empresa/logo`);
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(await promise).toBe(false);
    expect(service.logoEmpresaUrl()).toBe('');
  });

  it('logoEmpresaExiste() mantém fallback para falhas da API', async () => {
    const promise = firstValueFrom(service.logoEmpresaExiste());
    const req = httpMock.expectOne(`${environment.apiUrl}/empresa/logo`);
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    expect(await promise).toBe(false);
    expect(service.logoEmpresaUrl()).toBe('');
  });

  it('uploadLogoEmpresa() POST multipart e expõe URL do logo', async () => {
    const promise = firstValueFrom(service.uploadLogoEmpresa(PNG_TINY));
    const req = httpMock.expectOne(`${environment.apiUrl}/empresa/logo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(null, { status: 204, statusText: 'No Content' });
    await promise;

    expect(service.logoEmpresaUrl()).toContain(`${environment.apiUrl}/empresa/logo?v=`);
  });

  it('removerLogoEmpresa() DELETE limpa URL', async () => {
    const uploadPromise = firstValueFrom(service.uploadLogoEmpresa(PNG_TINY));
    httpMock
      .expectOne(`${environment.apiUrl}/empresa/logo`)
      .flush(null, { status: 204, statusText: 'No Content' });
    await uploadPromise;

    const removePromise = firstValueFrom(service.removerLogoEmpresa());
    const req = httpMock.expectOne(`${environment.apiUrl}/empresa/logo`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await removePromise;

    expect(service.logoEmpresaUrl()).toBe('');
  });
});
