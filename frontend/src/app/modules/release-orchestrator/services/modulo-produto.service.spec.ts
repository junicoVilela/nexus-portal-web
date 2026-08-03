import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ModuloProdutoService } from './modulo-produto.service';

const PRODUTO_ID = 'prod-1';
const BASE = `/api/v1/release-orchestrator/produtos/${PRODUTO_ID}/modulos`;

describe('ModuloProdutoService', () => {
  let service: ModuloProdutoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModuloProdutoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ModuloProdutoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar() chama GET na rota nested do produto', () => {
    service.listar(PRODUTO_ID).subscribe();
    const req = http.expectOne(r => r.method === 'GET' && r.url === BASE);
    expect(req.request.url).toBe(BASE);
    req.flush([]);
  });

  it('criar() POSTa o body completo (codigo + tipo + nome)', () => {
    service
      .criar(PRODUTO_ID, { nome: 'Portal', codigo: 'nexus-portal', tipo: 'WEB' })
      .subscribe();
    const req = http.expectOne(r => r.method === 'POST' && r.url === BASE);
    expect(req.request.body).toEqual({ nome: 'Portal', codigo: 'nexus-portal', tipo: 'WEB' });
    req.flush({});
  });

  it('atualizar() PUTa sem codigo nem tipo (imutáveis)', () => {
    service
      .atualizar(PRODUTO_ID, 'mod-1', { nome: 'Portal Web', geraDelta: false, obrigatorio: true })
      .subscribe();
    const req = http.expectOne(r => r.method === 'PUT' && r.url === `${BASE}/mod-1`);
    expect(req.request.body).toEqual({ nome: 'Portal Web', geraDelta: false, obrigatorio: true });
    expect(req.request.body.codigo).toBeUndefined();
    expect(req.request.body.tipo).toBeUndefined();
    req.flush({});
  });

  it('alterarStatus() faz PATCH com { ativo }', () => {
    service.alterarStatus(PRODUTO_ID, 'mod-1', false).subscribe();
    const req = http.expectOne(r => r.method === 'PATCH' && r.url === `${BASE}/mod-1/status`);
    expect(req.request.body).toEqual({ ativo: false });
    req.flush({});
  });

  it('excluir() faz DELETE no recurso', () => {
    service.excluir(PRODUTO_ID, 'mod-1').subscribe();
    const req = http.expectOne(r => r.method === 'DELETE' && r.url === `${BASE}/mod-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
