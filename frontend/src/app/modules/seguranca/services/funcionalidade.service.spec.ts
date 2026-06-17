import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { FuncionalidadeService } from './funcionalidade.service';
import { MockStore } from './mock/mock-store.service';

describe('FuncionalidadeService', () => {
  let service: FuncionalidadeService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(FuncionalidadeService);
  });

  it('listarPorDominio() filtra pelo dominioId', async () => {
    const seg = store.dominios().find(d => d.codigo === 'SEGURANCA')!;
    const r = await firstValueFrom(service.listarPorDominio(seg.id));
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(f => f.dominioId === seg.id)).toBe(true);
  });

  it('criar() rejeita dominio inválido', async () => {
    await expectAsync(
      firstValueFrom(service.criar({ dominioId: 'inexistente', nome: 'X', codigo: 'X', ativo: true })),
    ).toBeRejected();
  });

  it('atualizar() registra evento de auditoria FUNCIONALIDADE:EDITAR com diff', async () => {
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
