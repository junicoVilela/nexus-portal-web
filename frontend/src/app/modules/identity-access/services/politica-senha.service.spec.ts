import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PoliticaSenhaService } from './politica-senha.service';
import { UsuarioService } from './usuario.service';

const ADMIN_USER_ID = 'usuario-admin';

describe('PoliticaSenhaService', () => {
  let service: PoliticaSenhaService;
  let usuarios: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PoliticaSenhaService);
    usuarios = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('validar() reporta violação de tamanho mínimo', () => {
    const politica = service.atualSync();
    const r = service.validar('a', { ...politica, tamanhoMinimo: 8 });
    expect(r.valido).toBe(false);
    expect(r.violacoes[0]).toMatch(/8 caracteres/);
  });

  it('validar() exige maiúscula quando configurado', () => {
    const politica = service.atualSync();
    const r = service.validar('semmaius', { ...politica, exigirMaiuscula: true });
    expect(r.valido).toBe(false);
  });

  it('validar() passa com senha forte', () => {
    const r = service.validar('Senha@2026', {
      ...service.atualSync(),
      tamanhoMinimo: 8,
      exigirMaiuscula: true,
      exigirMinuscula: true,
      exigirNumero: true,
      exigirEspecial: true,
    });
    expect(r.valido).toBe(true);
  });

  it('propaga rejeição do backend para senha reutilizada', async () => {
    const promise = firstValueFrom(usuarios.resetarSenha(ADMIN_USER_ID, 'primeira'));
    http
      .expectOne(`/api/v1/rbac/usuarios/${ADMIN_USER_ID}/alterar-senha`)
      .flush({ message: 'Senha já utilizada.' }, { status: 409, statusText: 'Conflict' });

    await expectAsync(promise).toBeRejected();
  });

  it('propaga rejeição do backend para senha que viola a política', async () => {
    const promise = firstValueFrom(usuarios.resetarSenha(ADMIN_USER_ID, 'abc'));
    http
      .expectOne(`/api/v1/rbac/usuarios/${ADMIN_USER_ID}/alterar-senha`)
      .flush({ message: 'Senha fora da política.' }, { status: 400, statusText: 'Bad Request' });

    await expectAsync(promise).toBeRejected();
  });
});
