import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DominioService } from './dominio.service';
import { MockStore } from './mock/mock-store.service';

describe('DominioService', () => {
  let service: DominioService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(DominioService);
  });

  it('listarTodos() retorna seed', async () => {
    const r = await firstValueFrom(service.listarTodos());
    expect(r.length).toBeGreaterThan(0);
  });

  it('criar() rejeita código duplicado', async () => {
    await expectAsync(
      firstValueFrom(service.criar({ nome: 'Outro', codigo: 'SEGURANCA', ativo: true })),
    ).toBeRejected();
  });

  it('alterarStatus() altera ativo', async () => {
    const d = store.dominios()[0];
    const atualizado = await firstValueFrom(service.alterarStatus(d.id, !d.ativo));
    expect(atualizado.ativo).toBe(!d.ativo);
  });

  it('criar() registra evento de auditoria DOMINIO:CRIAR', async () => {
    await firstValueFrom(service.criar({ nome: 'Teste Audit', codigo: 'TEST_AUDIT', ativo: true }));
    const eventos = store.auditoria().filter(a => a.acao === 'DOMINIO:CRIAR');
    expect(eventos.length).toBeGreaterThan(0);
    expect(eventos[0].dadosNovos?.['codigo']).toBe('TEST_AUDIT');
  });
});
