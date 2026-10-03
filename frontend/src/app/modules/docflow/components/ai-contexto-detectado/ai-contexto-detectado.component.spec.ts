import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiContextoDetectadoComponent } from './ai-contexto-detectado.component';

describe('AiContextoDetectadoComponent', () => {
  let fixture: ComponentFixture<AiContextoDetectadoComponent>;

  function botao(texto: string): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button')).find(b =>
      (b as HTMLElement).textContent?.includes(texto),
    ) as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiContextoDetectadoComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(AiContextoDetectadoComponent);
    fixture.componentRef.setInput('contexto', { titulo: 'Consulta de pedidos', codigoTela: 'API-REST' });
    fixture.detectChanges();
  });

  it('mostra o que foi detectado e marca o que faltou', () => {
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Consulta de pedidos');
    expect(texto).toContain('API-REST');
    expect(texto).toContain('não identificado');
  });

  it('não renderiza quando a triagem não detectou nada', () => {
    fixture.componentRef.setInput('contexto', {});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ai-contexto')).toBeNull();
  });

  it('emite só os campos corrigidos', () => {
    const spy = jasmine.createSpy('corrigir');
    fixture.componentInstance.corrigir.subscribe(spy);
    botao('Corrigir').click();
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    inputs[1].value = 'PED-CONSULTA';
    inputs[1].dispatchEvent(new Event('input'));
    botao('Salvar correção').click();

    expect(spy).toHaveBeenCalledWith({ codigoTela: 'PED-CONSULTA' });
  });

  it('salvar sem mudanças não emite nada', () => {
    const spy = jasmine.createSpy('corrigir');
    fixture.componentInstance.corrigir.subscribe(spy);
    botao('Corrigir').click();
    fixture.detectChanges();
    botao('Salvar correção').click();
    expect(spy).not.toHaveBeenCalled();
  });
});
