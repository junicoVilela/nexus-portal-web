import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { PermissaoService } from './permissao.service';

describe('PermissaoService', () => {
  let service: PermissaoService;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/catalogo/permissoes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PermissaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTodos() bate no backend e popula cache', async () => {
    const promise = firstValueFrom(service.listarTodos());
    const req = http.expectOne(base);
    req.flush([
      {
        id: 'p1', funcionalidadeId: 'f1', funcionalidadeCodigo: 'USUARIO',
        dominioCodigo: 'SEGURANCA', acao: 'LER', codigo: 'USUARIO:LER',
        descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    const r = await promise;
    expect(r[0].codigo).toBe('USUARIO:LER');
    expect(service.idsPorCodigos(['USUARIO:LER'])).toEqual(['p1']);
  });

  it('listarTodos() reutiliza cache sem nova requisição', async () => {
    const primeira = firstValueFrom(service.listarTodos());
    http.expectOne(base).flush([
      {
        id: 'p1', funcionalidadeId: 'f1', funcionalidadeCodigo: 'USUARIO',
        dominioCodigo: 'SEGURANCA', acao: 'LER', codigo: 'USUARIO:LER',
        descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    await primeira;

    const segunda = await firstValueFrom(service.listarTodos());
    http.expectNone(base);
    expect(segunda.length).toBe(1);
  });

  it('idsPorCodigos() ignora códigos desconhecidos', () => {
    expect(service.idsPorCodigos(['INEXISTENTE'])).toEqual([]);
  });
});
