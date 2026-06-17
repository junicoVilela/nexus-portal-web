import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MockStore } from './mock/mock-store.service';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(UsuarioService);
  });

  it('listar() retorna PageResult com seed inicial', async () => {
    const r = await firstValueFrom(service.listar({}));
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.totalItems).toBe(r.items.length);
  });

  it('criar() persiste novo usuário', async () => {
    const u = await firstValueFrom(
      service.criar({
        nome: 'Novo',
        login: 'novo',
        email: 'novo@x.com',
        ativo: true,
        grupoIds: [],
        senha: 'pw1234',
      }),
    );
    expect(u.id).toBeTruthy();
    expect(store.usuarios().some(x => x.id === u.id)).toBe(true);
  });

  it('criar() rejeita login duplicado', async () => {
    await expectAsync(
      firstValueFrom(
        service.criar({ nome: 'X', login: 'admin', email: 'x@x.com', ativo: true, grupoIds: [] }),
      ),
    ).toBeRejected();
  });

  it('bloquear() seta a flag', async () => {
    const u = store.usuarios()[0];
    const blocked = await firstValueFrom(service.bloquear(u.id, true));
    expect(blocked.bloqueado).toBe(true);
  });

  it('resetarSenha() força trocarSenhaProximoLogin', async () => {
    const u = store.usuarios()[0];
    await firstValueFrom(service.resetarSenha(u.id, 'nova1234'));
    expect(store.usuarios().find(x => x.id === u.id)?.trocarSenhaProximoLogin).toBe(true);
  });
});
