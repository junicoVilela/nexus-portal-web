import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AuthService } from '@core/auth/services/auth.service';
import { ConfirmService, ToastService } from '@shared/ui';
import { Cliente } from '../../models/cliente.model';
import { ManualAcesso } from '../../models/manual-acesso.model';
import { ClienteService } from '../../services/cliente.service';
import { ManualAcessoService } from '../../services/manual-acesso.service';
import { ManualIntegracaoComponent } from './manual-integracao.component';

describe('ManualIntegracaoComponent', () => {
  let fixture: ComponentFixture<ManualIntegracaoComponent>;
  let acessos: jasmine.SpyObj<ManualAcessoService>;
  let confirm: jasmine.SpyObj<ConfirmService>;

  const chave: ManualAcesso = {
    id: 'a1',
    clienteId: 'c1',
    nome: 'NEXUS-LD',
    prefixo: 'nxm_abcdefgh',
    origens: ['https://app.acme.com'],
    ativo: true,
    expiraEm: null,
    ultimoUsoEm: null,
    createdAt: '2026-10-01T00:00:00Z',
    createdBy: 'ana',
  };

  beforeEach(async () => {
    acessos = jasmine.createSpyObj<ManualAcessoService>('ManualAcessoService', [
      'listar',
      'criar',
      'revogar',
      'apiPublica',
    ]);
    acessos.listar.and.returnValue(of([chave]));
    acessos.apiPublica.and.returnValue('https://portal.test/api/v1');
    confirm = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['confirm']);
    const clientes = jasmine.createSpyObj<ClienteService>('ClienteService', ['clientes']);
    clientes.clientes.and.returnValue(of([{ id: 'c1', nome: 'ACME', ativo: true } as Cliente]));
    await TestBed.configureTestingModule({
      imports: [ManualIntegracaoComponent],
      providers: [
        lucideTestIcons,
        { provide: ManualAcessoService, useValue: acessos },
        { provide: ClienteService, useValue: clientes },
        { provide: ConfirmService, useValue: confirm },
        { provide: AuthService, useValue: { tem: () => () => true } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ManualIntegracaoComponent);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('#mi-cliente') as HTMLSelectElement;
    select.value = 'c1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  });

  it('lista as chaves do cliente sem mostrar o token', () => {
    expect(acessos.listar).toHaveBeenCalledWith('c1');
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('NEXUS-LD');
    expect(texto).toContain('nxm_abcdefgh…');
    expect(texto).toContain('https://app.acme.com');
  });

  it('cria a chave com origens e mostra token e snippet uma vez', () => {
    acessos.criar.and.returnValue(
      of({ acesso: { ...chave, id: 'a2', nome: 'Portal' }, token: 'nxm_segredo' }),
    );
    const [nome, origens] = [
      fixture.nativeElement.querySelector('input[aria-label="Nome da chave"]') as HTMLInputElement,
      fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement,
    ];
    nome.value = 'Portal';
    nome.dispatchEvent(new Event('input'));
    origens.value = 'https://app.acme.com\nhttps://hml.acme.com';
    origens.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(acessos.criar).toHaveBeenCalledWith('c1', {
      nome: 'Portal',
      origens: ['https://app.acme.com', 'https://hml.acme.com'],
      diasValidade: null,
    });
    const snippet = fixture.nativeElement.querySelector('.mi__snippet').textContent;
    expect(snippet).toContain(
      'src="https://portal.test/api/v1/manual/help-bridge.js" data-token="nxm_segredo"',
    );
    expect(fixture.nativeElement.textContent).toContain('não aparece de novo');
  });

  it('revoga depois de confirmar', async () => {
    confirm.confirm.and.resolveTo(true);
    acessos.revogar.and.returnValue(of(undefined));

    (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[])
      .find(b => b.textContent?.includes('Revogar'))!
      .click();
    await fixture.whenStable();

    expect(acessos.revogar).toHaveBeenCalledWith('a1');
  });
});
