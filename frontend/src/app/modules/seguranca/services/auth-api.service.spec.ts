import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { MockStore } from './mock/mock-store.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(AuthApiService);
  });

  it('login("admin", "admin") retorna token e usuário', async () => {
    const r = await firstValueFrom(service.login('admin', 'admin'));
    expect(r.token).toBeTruthy();
    expect(r.usuario.login).toBe('admin');
  });

  it('login() com senha errada rejeita e incrementa tentativas', async () => {
    const userBefore = store.usuarios().find(u => u.login === 'admin')!;
    const tentativasAntes = userBefore.tentativasInvalidas;
    await expectAsync(firstValueFrom(service.login('admin', 'errada'))).toBeRejected();
    const userAfter = store.usuarios().find(u => u.login === 'admin')!;
    expect(userAfter.tentativasInvalidas).toBe(tentativasAntes + 1);
  });

  it('me() devolve usuário autenticado com permissões', async () => {
    const r = await firstValueFrom(service.login('admin', 'admin'));
    // AuthApiService.login não persiste o token; quem faz isso é AuthService.
    // Para o teste isolado, simulamos a persistência aqui.
    localStorage.setItem('doc-flow-jwt', r.token);
    const me = await firstValueFrom(service.me());
    expect(me.login).toBe('admin');
    expect(me.permissoes.length).toBeGreaterThan(0);
    localStorage.removeItem('doc-flow-jwt');
  });
});
