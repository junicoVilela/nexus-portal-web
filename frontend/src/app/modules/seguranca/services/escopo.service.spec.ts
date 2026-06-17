import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { EscopoService } from './escopo.service';
import { MockStore } from './mock/mock-store.service';

describe('EscopoService', () => {
  let service: EscopoService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(EscopoService);
  });

  it('criar() exige usuarioId ou grupoAcessoId', async () => {
    await expectAsync(firstValueFrom(service.criar({ somenteLeitura: false, ativo: true }))).toBeRejected();
  });

  it('criar() + listarPorUsuario() devolve o escopo do usuário', async () => {
    const userId = store.ADMIN_USER_ID;
    await firstValueFrom(
      service.criar({ usuarioId: userId, clienteId: 'cli-x', somenteLeitura: false, ativo: true }),
    );
    const r = await firstValueFrom(service.listarPorUsuario(userId));
    expect(r.some(e => e.clienteId === 'cli-x')).toBe(true);
  });

  it('atualizar() altera flags', async () => {
    const e = await firstValueFrom(
      service.criar({
        grupoAcessoId: store.ADMIN_GROUP_ID,
        produtoId: 'prod-1',
        somenteLeitura: false,
        ativo: true,
      }),
    );
    const atu = await firstValueFrom(service.atualizar(e.id, { somenteLeitura: true, ativo: false }));
    expect(atu.somenteLeitura).toBe(true);
    expect(atu.ativo).toBe(false);
  });

  it('remover() exclui o escopo', async () => {
    const e = await firstValueFrom(
      service.criar({ usuarioId: store.ADMIN_USER_ID, somenteLeitura: false, ativo: true }),
    );
    await firstValueFrom(service.remover(e.id));
    expect(store.escopos().some(x => x.id === e.id)).toBe(false);
  });
});
