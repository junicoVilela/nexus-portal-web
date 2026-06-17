import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PermissaoService } from './permissao.service';
import { MockStore } from './mock/mock-store.service';

describe('PermissaoService', () => {
  let service: PermissaoService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(PermissaoService);
  });

  it('listarTodos() retorna seed completo', async () => {
    const r = await firstValueFrom(service.listarTodos());
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(p => p.codigo.includes(':'))).toBe(true);
  });

  it('listar({ funcionalidadeId }) filtra corretamente', async () => {
    const func = store.funcionalidades()[0];
    const r = await firstValueFrom(service.listar({ funcionalidadeId: func.id, size: 100 }));
    expect(r.items.every(p => p.funcionalidadeId === func.id)).toBe(true);
  });

  it('criar() rejeita código duplicado', async () => {
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

  it('alterarStatus() registra auditoria PERMISSAO:ATIVAR/INATIVAR', async () => {
    const p = store.permissoes()[0];
    await firstValueFrom(service.alterarStatus(p.id, !p.ativo));
    const ev = store.auditoria().find(a => a.recursoId === p.id);
    expect(ev?.acao).toBe(p.ativo ? 'PERMISSAO:INATIVAR' : 'PERMISSAO:ATIVAR');
  });
});
