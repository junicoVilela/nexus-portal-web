import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginaTemplateSaveComponent } from './pagina-template-save.component';

describe('PaginaTemplateSaveComponent', () => {
  let fixture: ComponentFixture<PaginaTemplateSaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginaTemplateSaveComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginaTemplateSaveComponent);
    fixture.componentRef.setInput('projetos', [
      { id: 'projeto-1', nome: 'Portal', slug: 'portal', ativo: true },
    ]);
    fixture.componentRef.setInput('clientes', [
      { id: 'cliente-1', nome: 'Nexus', slug: 'nexus', ativo: true },
    ]);
    fixture.componentRef.setInput('projetoIdInicial', 'projeto-1');
    fixture.detectChanges();
  });

  it('inicia com o projeto atual selecionado', () => {
    expect(fixture.componentInstance.form.controls.escopo.value).toBe('PROJETO');
    expect(fixture.componentInstance.form.controls.projetoId.value).toBe('projeto-1');
    expect(fixture.nativeElement.textContent).toContain('Salvar a estrutura atual como modelo');
  });

  it('emite um modelo de projeto com dados normalizados', () => {
    const emitSpy = spyOn(fixture.componentInstance.confirmado, 'emit');
    fixture.componentInstance.form.patchValue({
      nome: '  Cadastro financeiro  ',
      descricao: '  Estrutura padrão  ',
    });

    fixture.componentInstance.salvar();

    expect(emitSpy).toHaveBeenCalledWith({
      nome: 'Cadastro financeiro',
      descricao: 'Estrutura padrão',
      projetoId: 'projeto-1',
      clienteId: undefined,
    });
  });

  it('permite trocar o escopo para cliente', () => {
    const emitSpy = spyOn(fixture.componentInstance.confirmado, 'emit');
    fixture.componentInstance.definirEscopo('CLIENTE');
    fixture.componentInstance.form.patchValue({ nome: 'Modelo Nexus', clienteId: 'cliente-1' });

    fixture.componentInstance.salvar();

    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ nome: 'Modelo Nexus', clienteId: 'cliente-1', projetoId: undefined }),
    );
  });

  it('não emite sem nome ou escopo selecionado', () => {
    const emitSpy = spyOn(fixture.componentInstance.confirmado, 'emit');
    fixture.componentInstance.form.patchValue({ nome: '', projetoId: '' });

    fixture.componentInstance.salvar();

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
