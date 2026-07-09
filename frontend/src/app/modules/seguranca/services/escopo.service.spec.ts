import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { EscopoService } from './escopo.service';

describe('EscopoService (HTTP)', () => {
  let service: EscopoService;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/escopos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EscopoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const backend = (over: Record<string, unknown> = {}) => ({
    id: 'e1',
    usuarioId: null,
    grupoAcessoId: null,
    clienteId: null,
    ambienteId: null,
    produtoId: null,
    tipoAmbiente: null,
    somenteLeitura: false,
    ativo: true,
    criadoEm: '2026-01-01T00:00:00Z',
    atualizadoEm: null,
    ...over,
  });

  it('listarPorUsuario() bate no /escopos com filtro usuarioId', async () => {
    const promise = firstValueFrom(service.listarPorUsuario('u1'));
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('usuarioId')).toBe('u1');
    req.flush([backend({ usuarioId: 'u1', clienteId: 'cli-x' })]);
    const r = await promise;
    expect(r[0].clienteId).toBe('cli-x');
  });

  it('criar() envia payload com nulls explícitos', async () => {
    const promise = firstValueFrom(service.criar({
      usuarioId: 'u1', clienteId: 'cli-x', somenteLeitura: false, ativo: true,
    }));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.usuarioId).toBe('u1');
    expect(req.request.body.clienteId).toBe('cli-x');
    expect(req.request.body.grupoAcessoId).toBeNull();
    req.flush(backend({ usuarioId: 'u1', clienteId: 'cli-x' }));
    const e = await promise;
    expect(e.usuarioId).toBe('u1');
  });

  it('alterarStatus() faz PATCH /status', async () => {
    const promise = firstValueFrom(service.alterarStatus('e1', false));
    const req = http.expectOne(r => r.url === `${base}/e1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.params.get('ativo')).toBe('false');
    req.flush(backend({ ativo: false }));
    const e = await promise;
    expect(e.ativo).toBe(false);
  });

  it('remover() faz DELETE', async () => {
    const promise = firstValueFrom(service.remover('e1'));
    const req = http.expectOne(`${base}/e1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await promise;
  });
});
