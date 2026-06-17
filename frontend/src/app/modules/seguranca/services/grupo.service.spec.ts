import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { GrupoService } from './grupo.service';
import { MockStore } from './mock/mock-store.service';

describe('GrupoService', () => {
  let service: GrupoService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(GrupoService);
  });

  it('listar() retorna grupos com totalUsuarios calculado', async () => {
    const r = await firstValueFrom(service.listar({}));
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every(g => typeof g.totalUsuarios === 'number')).toBe(true);
  });

  it('criar() rejeita código duplicado', async () => {
    await expectAsync(
      firstValueFrom(service.criar({ nome: 'Outro', codigo: 'ADMIN', descricao: '', ativo: true })),
    ).toBeRejected();
  });

  it('vincularPermissoes() em grupo não-admin atualiza a lista', async () => {
    const leitor = store.grupos().find(g => g.codigo === 'LEITOR')!;
    const novasPerms = [store.permissoes()[0].id];
    await firstValueFrom(service.vincularPermissoes(leitor.id, novasPerms));
    expect(store.grupos().find(g => g.id === leitor.id)?.permissaoIds).toEqual(novasPerms);
  });

  it('vincularPermissoes() em ADMIN é no-op (não altera lista)', async () => {
    const adminId = store.ADMIN_GROUP_ID;
    const originais = store.grupos().find(g => g.id === adminId)?.permissaoIds ?? [];
    await firstValueFrom(service.vincularPermissoes(adminId, []));
    expect(store.grupos().find(g => g.id === adminId)?.permissaoIds).toEqual(originais);
  });
});
