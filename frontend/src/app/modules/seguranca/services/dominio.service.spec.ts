import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { DominioService } from './dominio.service';
import { MockStore } from './mock/mock-store.service';

describe('DominioService', () => {
  let service: DominioService;
  let store: MockStore;
  let http: HttpTestingController;
  const base = `${environment.rbacApiUrl}/catalogo/dominios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(DominioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarTodos() bate em /catalogo/dominios e popula MockStore', async () => {
    const promise = firstValueFrom(service.listarTodos());
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([{
      id: 'd1', codigo: 'SEGURANCA', nome: 'Segurança', descricao: null, ativo: true,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: null,
    }]);
    const list = await promise;
    expect(list.map(d => d.codigo)).toContain('SEGURANCA');
    expect(store.dominios().map(d => d.codigo)).toContain('SEGURANCA');
  });

  it('criar() (mock local) rejeita código duplicado', async () => {
    await expectAsync(
      firstValueFrom(service.criar({ nome: 'Outro', codigo: 'SEGURANCA', ativo: true })),
    ).toBeRejected();
  });

  it('alterarStatus() (mock local) inverte ativo', async () => {
    const d = store.dominios()[0];
    const atualizado = await firstValueFrom(service.alterarStatus(d.id, !d.ativo));
    expect(atualizado.ativo).toBe(!d.ativo);
  });
});
