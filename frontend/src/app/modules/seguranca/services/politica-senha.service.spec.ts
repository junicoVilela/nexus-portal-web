import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MockStore } from './mock/mock-store.service';
import { PoliticaSenhaService } from './politica-senha.service';
import { UsuarioService } from './usuario.service';

describe('PoliticaSenhaService', () => {
  let service: PoliticaSenhaService;
  let usuarios: UsuarioService;
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MockStore);
    store.reset();
    service = TestBed.inject(PoliticaSenhaService);
    usuarios = TestBed.inject(UsuarioService);
  });

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

  it('reset rejeita senha reutilizada (histórico)', async () => {
    // Endurece a política para o teste.
    await firstValueFrom(
      service.atualizar({
        tamanhoMinimo: 4,
        exigirMaiuscula: false,
        exigirMinuscula: false,
        exigirNumero: false,
        exigirEspecial: false,
        expiraSenhaDias: null,
        quantidadeHistorico: 3,
        maxTentativasInvalidas: 5,
      }),
    );
    const userId = store.ADMIN_USER_ID;
    await firstValueFrom(usuarios.resetarSenha(userId, 'primeira'));
    await firstValueFrom(usuarios.resetarSenha(userId, 'segunda'));
    await expectAsync(firstValueFrom(usuarios.resetarSenha(userId, 'primeira'))).toBeRejected();
  });

  it('reset rejeita senha que viola a política', async () => {
    await firstValueFrom(
      service.atualizar({
        tamanhoMinimo: 8,
        exigirMaiuscula: true,
        exigirMinuscula: true,
        exigirNumero: true,
        exigirEspecial: true,
        expiraSenhaDias: null,
        quantidadeHistorico: 3,
        maxTentativasInvalidas: 5,
      }),
    );
    await expectAsync(firstValueFrom(usuarios.resetarSenha(store.ADMIN_USER_ID, 'abc'))).toBeRejected();
  });
});
