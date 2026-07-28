import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginaCreationProgressComponent } from './pagina-creation-progress.component';

describe('PaginaCreationProgressComponent', () => {
  let fixture: ComponentFixture<PaginaCreationProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginaCreationProgressComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginaCreationProgressComponent);
    fixture.componentRef.setInput('steps', [
      { id: 'modelo', label: 'Modelo', description: 'Estrutura', complete: true },
      { id: 'contexto', label: 'Contexto', description: 'Dados', complete: false },
      { id: 'conteudo', label: 'Conteúdo', description: 'Editor', complete: false },
      { id: 'revisao', label: 'Revisão', description: 'Qualidade', complete: false },
    ]);
    fixture.componentRef.setInput('current', 'contexto');
    fixture.detectChanges();
  });

  it('exibe progresso e emite a etapa escolhida', () => {
    const selected = spyOn(fixture.componentInstance.selected, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    expect(fixture.componentInstance.progress()).toBe(25);
    buttons[2].click();
    expect(selected).toHaveBeenCalledWith('conteudo');
  });
});
