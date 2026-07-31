import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginaBlockLibraryComponent } from './pagina-block-library.component';

describe('PaginaBlockLibraryComponent', () => {
  let fixture: ComponentFixture<PaginaBlockLibraryComponent>;

  beforeEach(async () => {
    localStorage.removeItem('docflow:blocos-recentes');
    await TestBed.configureTestingModule({ imports: [PaginaBlockLibraryComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginaBlockLibraryComponent);
    fixture.detectChanges();
  });

  it('abre a biblioteca e apresenta os blocos disponíveis', () => {
    (fixture.nativeElement.querySelector('.block-library__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.block-card').length).toBe(15);
    expect(fixture.nativeElement.textContent).toContain('Objetivo de negócio');
    expect(fixture.nativeElement.textContent).toContain('Checklist de progresso');
    expect(fixture.nativeElement.textContent).toContain('Elementos · tela toda');
    expect(fixture.nativeElement.textContent).toContain('Elementos · meia tela');
    expect(fixture.nativeElement.textContent).toContain('Elementos · 3 colunas');
  });

  it('filtra por categoria', () => {
    fixture.componentInstance.aberta.set(true);
    fixture.componentInstance.categoria.set('Navegação');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.block-card').length).toBe(2);
  });

  it('busca blocos por nome ignorando acentos', () => {
    fixture.componentInstance.aberta.set(true);
    fixture.componentInstance.busca.set('dicionario');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.block-card').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Dicionário de campos');
  });

  it('abre o menu de comando com busca limpa e todas as categorias', () => {
    fixture.componentInstance.busca.set('faq');
    fixture.componentInstance.categoria.set('Referência');

    fixture.componentInstance.abrirComBusca();

    expect(fixture.componentInstance.aberta()).toBe(true);
    expect(fixture.componentInstance.busca()).toBe('');
    expect(fixture.componentInstance.categoria()).toBe('Todos');
  });

  it('emite o bloco selecionado', () => {
    const emitSpy = spyOn(fixture.componentInstance.blocoSelecionado, 'emit');
    fixture.componentInstance.aberta.set(true);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.block-card') as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'introducao' }));
    expect(fixture.componentInstance.aberta()).toBe(false);
  });

  it('mantém os últimos blocos usados disponíveis no filtro Recentes', () => {
    const bloco = fixture.componentInstance.blocos()[2]!;
    fixture.componentInstance.selecionar(bloco);
    fixture.componentInstance.categoria.set('Recentes');

    expect(fixture.componentInstance.blocos().map(item => item.id)).toEqual([bloco.id]);
    expect(localStorage.getItem('docflow:blocos-recentes')).toContain(bloco.id);
  });
});
