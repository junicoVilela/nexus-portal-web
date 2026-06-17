import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ConfiguracaoService } from './configuracao.service';

const STORAGE_KEY = 'doc-flow:empresa-logo';
const PNG_TINY = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'logo.png', {
  type: 'image/png',
});

describe('ConfiguracaoService', () => {
  let service: ConfiguracaoService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [ConfiguracaoService] });
    service = TestBed.inject(ConfiguracaoService);
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('logoEmpresaUrl vazio quando nada foi salvo', () => {
    expect(service.logoEmpresaUrl).toBe('');
  });

  it('logoEmpresaExiste() retorna false quando não há logo', async () => {
    expect(await firstValueFrom(service.logoEmpresaExiste())).toBe(false);
  });

  it('uploadLogoEmpresa() persiste data URL e logoEmpresaExiste() vira true', async () => {
    await firstValueFrom(service.uploadLogoEmpresa(PNG_TINY));
    expect(service.logoEmpresaUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(await firstValueFrom(service.logoEmpresaExiste())).toBe(true);
  });

  it('removerLogoEmpresa() limpa o estado', async () => {
    await firstValueFrom(service.uploadLogoEmpresa(PNG_TINY));
    await firstValueFrom(service.removerLogoEmpresa());
    expect(service.logoEmpresaUrl).toBe('');
    expect(await firstValueFrom(service.logoEmpresaExiste())).toBe(false);
  });
});
