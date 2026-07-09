import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { PermissaoService } from './permissao.service';
import { MockStore } from './mock/mock-store.service';

describe('PermissaoService', () => {
  let service: PermissaoService;
  let store: MockStore;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/catalogo/permissoes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(PermissaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTodos() bate no backend e popula MockStore', async () => {
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
    expect(store.permissoes().length).toBe(1);
  });

  it('criar() (mock local) rejeita código duplicado', async () => {
    const existente = store.permissoes()[0];
    const func = store.funcionalidades().find(f => f.id === existente.funcionalidadeId)!;
    await expectAsync(
      firstValueFrom(
        service.criar({
          funcionalidadeId: func.id,
          acao: existente.acao,
          codigo: existente.codigo,
          ativo: true,
        }),
      ),
    ).toBeRejected();
  });

  it('alterarStatus() (mock local) registra auditoria PERMISSAO:ATIVAR/INATIVAR', async () => {
    const p = store.permissoes()[0];
    await firstValueFrom(service.alterarStatus(p.id, !p.ativo));
    const ev = store.auditoria().find(a => a.recursoId === p.id);
    expect(ev?.acao).toBe(p.ativo ? 'PERMISSAO:INATIVAR' : 'PERMISSAO:ATIVAR');
  });
});
