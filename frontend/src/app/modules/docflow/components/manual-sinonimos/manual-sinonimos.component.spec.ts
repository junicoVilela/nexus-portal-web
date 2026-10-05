import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { ConfirmService, ToastService } from '@shared/ui';
import { ManualSinonimo } from '../../models/manual-sinonimo.model';
import { ManualSinonimoService } from '../../services/manual-sinonimo.service';
import { ManualSinonimosComponent, termosDoTexto } from './manual-sinonimos.component';

describe('ManualSinonimosComponent', () => {
  let fixture: ComponentFixture<ManualSinonimosComponent>;
  let service: jasmine.SpyObj<ManualSinonimoService>;
  let confirm: jasmine.SpyObj<ConfirmService>;

  const grupo: ManualSinonimo = {
    id: 's1',
    clienteId: 'c1',
    termos: ['nota fiscal', 'NF'],
    createdAt: '2026-10-01T00:00:00Z',
    createdBy: 'ana',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  async function criar(termoInicial: string | null = null): Promise<void> {
    service = jasmine.createSpyObj<ManualSinonimoService>('ManualSinonimoService', [
      'listar',
      'criar',
      'atualizar',
      'excluir',
    ]);
    service.listar.and.returnValue(of([grupo]));
    confirm = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['confirm']);
    await TestBed.configureTestingModule({
      imports: [ManualSinonimosComponent],
      providers: [
        lucideTestIcons,
        { provide: ManualSinonimoService, useValue: service },
        { provide: ConfirmService, useValue: confirm },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ManualSinonimosComponent);
    fixture.componentRef.setInput('clienteId', 'c1');
    fixture.componentRef.setInput('podeEditar', true);
    fixture.componentRef.setInput('termoInicial', termoInicial);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function campoNovo(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[aria-label="Novos sinônimos"]');
  }

  it('separa os termos por vírgula, ponto e vírgula ou linha', () => {
    expect(termosDoTexto(' nota fiscal, NF;\nNF-e ,, ')).toEqual(['nota fiscal', 'NF', 'NF-e']);
  });

  it('lista os grupos do cliente', async () => {
    await criar();
    expect(service.listar).toHaveBeenCalledWith('c1');
    const termos = Array.from(fixture.nativeElement.querySelectorAll('.ms__termo')).map(
      e => (e as HTMLElement).textContent,
    );
    expect(termos).toEqual(['nota fiscal', 'NF']);
  });

  it('adiciona um grupo com pelo menos dois termos', async () => {
    await criar();
    service.criar.and.returnValue(of({ ...grupo, id: 's2', termos: ['situação', 'status'] }));

    campoNovo().value = 'situação, status';
    campoNovo().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(service.criar).toHaveBeenCalledWith('c1', { termos: ['situação', 'status'] });
    expect(fixture.nativeElement.querySelectorAll('.ms__grupo').length).toBe(2);
    expect(campoNovo().value).toBe('');
  });

  it('não envia com um termo só', async () => {
    await criar();
    campoNovo().value = 'NF';
    campoNovo().dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    expect(service.criar).not.toHaveBeenCalled();
  });

  it('termo vindo da lacuna já começa o formulário', async () => {
    await criar('NF');
    expect(campoNovo().value).toBe('NF, ');
  });

  it('exclui depois de confirmar', async () => {
    await criar();
    confirm.confirm.and.resolveTo(true);
    service.excluir.and.returnValue(of(undefined));

    const excluir = Array.from(fixture.nativeElement.querySelectorAll('button')).find(b =>
      (b as HTMLElement).textContent?.includes('Excluir'),
    ) as HTMLButtonElement;
    excluir.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.excluir).toHaveBeenCalledWith('s1');
    expect(fixture.nativeElement.textContent).toContain('Nenhum sinônimo');
  });
});
