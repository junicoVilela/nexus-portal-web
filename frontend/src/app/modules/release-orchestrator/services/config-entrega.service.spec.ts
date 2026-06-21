import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ConfigEntregaService } from './config-entrega.service';

const CLIENTE_ID = 'cli-1';
const URL = `/api/v1/release-orchestrator/clientes/${CLIENTE_ID}/config-entrega`;

describe('ConfigEntregaService', () => {
  let service: ConfigEntregaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigEntregaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigEntregaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('buscar() faz GET', () => {
    service.buscar(CLIENTE_ID).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === URL);
    expect(req.request.url).toBe(URL);
    req.flush({});
  });

  it('salvar() faz PUT (upsert) com tipoDestino + caminhoBase', () => {
    service
      .salvar(CLIENTE_ID, { tipoDestino: 'PASTA', caminhoBase: '/var/lib/x' })
      .subscribe();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === URL);
    expect(req.request.body).toEqual({ tipoDestino: 'PASTA', caminhoBase: '/var/lib/x' });
    req.flush({});
  });
});
