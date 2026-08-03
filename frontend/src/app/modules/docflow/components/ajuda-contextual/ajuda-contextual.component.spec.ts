import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { AjudaContextualComponent } from './ajuda-contextual.component';
import { AjudaService } from '../../services/ajuda.service';

describe('AjudaContextualComponent', () => {
  let fixture: ComponentFixture<AjudaContextualComponent>;

  beforeEach(async () => {
    localStorage.removeItem('docflow:onboarding:v1');
    localStorage.removeItem('docflow:onboarding:v1:visualizado');
    await TestBed.configureTestingModule({
      imports: [AjudaContextualComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(AjudaContextualComponent);
    fixture.detectChanges();
  });

  it('oferece onboarding na primeira entrada', () => {
    expect(fixture.nativeElement.textContent).toContain('Primeira vez no DocFlow?');
    fixture.componentInstance['abrir']('onboarding');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cadastrar um cliente');
  });

  it('persiste o progresso dos primeiros passos', () => {
    fixture.componentInstance['concluirOnboarding'](fixture.componentInstance['onboarding'][0]);
    expect(localStorage.getItem('docflow:onboarding:v1')).toContain('cliente');
  });

  it('registra a conclusão do onboarding apenas uma vez', () => {
    const ajuda = TestBed.inject(AjudaService);
    const registrar = spyOn(ajuda, 'registrarEvento');
    const component = fixture.componentInstance;
    component['onboarding'].forEach(item => component['concluirOnboarding'](item));
    component['concluirOnboarding'](component['onboarding'][5]);

    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledWith(jasmine.objectContaining({ tipo: 'ONBOARDING_CONCLUIDO' }));
  });

  it('fecha o painel com Escape e devolve o foco ao acionador', fakeAsync(() => {
    const acionador = fixture.nativeElement.querySelector('.context-trigger') as HTMLButtonElement;
    acionador.focus();
    fixture.componentInstance['abrir']();
    fixture.detectChanges();
    tick();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.context-drawer'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    tick();

    expect(fixture.nativeElement.querySelector('.context-drawer')).toBeNull();
    expect(document.activeElement).toBe(acionador);
  }));
});
