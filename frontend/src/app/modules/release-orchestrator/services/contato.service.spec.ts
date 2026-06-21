import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ContatoService } from './contato.service';

const CLIENTE_ID = 'cli-1';
const BASE = `/api/v1/release-orchestrator/clientes/${CLIENTE_ID}/contatos`;

describe('ContatoService', () => {
  let service: ContatoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContatoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContatoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() faz GET na rota nested do cliente', () => {
    service.listar(CLIENTE_ID).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.url).toBe(BASE);
    req.flush([]);
  });

  it('criar() POSTa o body completo', () => {
    service
      .criar(CLIENTE_ID, { nome: 'Ana', papel: 'TECNICO', email: 'ana@x.com' })
      .subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body).toEqual({ nome: 'Ana', papel: 'TECNICO', email: 'ana@x.com' });
    req.flush({});
  });

  it('atualizar() faz PUT no recurso', () => {
    service
      .atualizar(CLIENTE_ID, 'con-1', { nome: 'X', papel: 'OUTRO', email: 'x@x.com' })
      .subscribe();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/con-1`);
    expect(req.request.body.papel).toBe('OUTRO');
    req.flush({});
  });

  it('excluir() faz DELETE', () => {
    service.excluir(CLIENTE_ID, 'con-1').subscribe();
    const req = http.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/con-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
