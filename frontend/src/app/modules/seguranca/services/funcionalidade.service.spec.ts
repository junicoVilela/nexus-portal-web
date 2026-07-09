import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { FuncionalidadeService } from './funcionalidade.service';
import { MockStore } from './mock/mock-store.service';

describe('FuncionalidadeService', () => {
  let service: FuncionalidadeService;
  let store: MockStore;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/catalogo/funcionalidades`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(FuncionalidadeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPorDominio() filtra pelo dominioId', async () => {
    const seg = store.dominios().find(d => d.codigo === 'SEGURANCA')!;
    const promise = firstValueFrom(service.listarPorDominio(seg.id));
    const req = http.expectOne(base);
    req.flush([
      {
        id: 'f1', dominioId: seg.id, dominioCodigo: 'SEGURANCA',
        codigo: 'USUARIO', nome: 'Usuário', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
      {
        id: 'f2', dominioId: 'outro-id', dominioCodigo: 'OUTRO',
        codigo: 'X', nome: 'X', descricao: null, ativo: true,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
      },
    ]);
    const r = await promise;
    expect(r.every(f => f.dominioId === seg.id)).toBe(true);
    expect(r.length).toBe(1);
  });

  it('criar() (mock local) rejeita dominio inválido', async () => {
    await expectAsync(
      firstValueFrom(service.criar({ dominioId: 'inexistente', nome: 'X', codigo: 'X', ativo: true })),
    ).toBeRejected();
  });

  it('atualizar() (mock local) registra evento FUNCIONALIDADE:EDITAR com diff', async () => {
    const f = store.funcionalidades()[0];
    await firstValueFrom(
      service.atualizar(f.id, {
        dominioId: f.dominioId,
        nome: f.nome + ' (alterado)',
        codigo: f.codigo,
        ativo: f.ativo,
      }),
    );
    const ev = store.auditoria().find(a => a.acao === 'FUNCIONALIDADE:EDITAR' && a.recursoId === f.id);
    expect(ev).toBeDefined();
    expect(ev?.dadosAnteriores?.['nome']).toBe(f.nome);
    expect(ev?.dadosNovos?.['nome']).toBe(f.nome + ' (alterado)');
  });
});
