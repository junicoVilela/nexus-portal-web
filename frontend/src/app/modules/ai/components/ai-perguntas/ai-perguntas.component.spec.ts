import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';

import { AiPerguntasComponent } from './ai-perguntas.component';

describe('AiPerguntasComponent', () => {
  let fixture: ComponentFixture<AiPerguntasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiPerguntasComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
    fixture = TestBed.createComponent(AiPerguntasComponent);
    fixture.componentRef.setInput('perguntas', [
      {
        id: 'q1',
        texto: 'Qual o público?',
        opcoes: ['Operador', 'Admin'],
        obrigatoria: true,
      },
    ]);
    fixture.componentRef.setInput('respostas', {});
    fixture.detectChanges();
  });

  it('emite respostaChange ao selecionar opção', () => {
    const spy = jasmine.createSpy('respostaChange');
    fixture.componentInstance.respostaChange.subscribe(spy);

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'Operador';
    select.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalledWith({ id: 'q1', valor: 'Operador' });
  });

  it('emite enviar ao clicar no botão', () => {
    const spy = jasmine.createSpy('enviar');
    fixture.componentInstance.enviar.subscribe(spy);
    fixture.nativeElement.querySelector('button')?.click();
    expect(spy).toHaveBeenCalled();
  });
});
