import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BLOCOS_PAGINA } from './pagina-block-library.blocks';
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

    expect(fixture.nativeElement.querySelectorAll('.block-card').length).toBe(BLOCOS_PAGINA.length);
    expect(fixture.nativeElement.textContent).toContain('Objetivo de negócio');
    expect(fixture.nativeElement.textContent).toContain('Passo a passo');
    expect(fixture.nativeElement.textContent).toContain('Kit · Página de lista');
    expect(fixture.nativeElement.textContent).toContain('Pré-requisitos');
  });

  it('filtra por categoria Kits', () => {
    fixture.componentInstance.aberta.set(true);
    fixture.componentInstance.categoria.set('Kits');
    fixture.detectChanges();

    const cards = [...fixture.nativeElement.querySelectorAll('.block-card')] as HTMLElement[];
    expect(cards.length).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('Kit · Página de lista');
    expect(fixture.nativeElement.textContent).toContain('Kit · Página de inclusão');
    expect(fixture.nativeElement.textContent).toContain('Kit · Página de edição');
    expect(fixture.nativeElement.textContent).toContain('Kit · Índice de operações');
    expect(fixture.nativeElement.textContent).toContain('Kit · Menu / pasta');
  });

  it('filtra por categoria Navegação', () => {
    fixture.componentInstance.aberta.set(true);
    fixture.componentInstance.categoria.set('Navegação');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.block-card').length).toBe(
      BLOCOS_PAGINA.filter(b => b.categoria === 'Navegação').length,
    );
  });

  it('busca blocos por nome ignorando acentos', () => {
    fixture.componentInstance.aberta.set(true);
    fixture.componentInstance.busca.set('dicionario de campos');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.block-card').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Dicionário de campos');
  });

  it('busca kits e callouts operacionais', () => {
    fixture.componentInstance.aberta.set(true);
    fixture.componentInstance.busca.set('entao');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('SE → ENTÃO');
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

  it('abre painel de parametrização para ações da tela', () => {
    fixture.componentInstance.aberta.set(true);
    fixture.detectChanges();

    const acoes = BLOCOS_PAGINA.find(bloco => bloco.id === 'acoes-tela')!;
    fixture.componentInstance.selecionar(acoes);
    fixture.detectChanges();

    expect(fixture.componentInstance.parametrizacaoAtiva()).toBe('acoes-tela');
    expect(fixture.nativeElement.textContent).toContain('Personalizar bloco');
    expect(fixture.nativeElement.querySelectorAll('.block-library__param-table input').length).toBeGreaterThan(0);
  });

  it('confirma parametrização e emite bloco com HTML gerado', () => {
    const emitSpy = spyOn(fixture.componentInstance.blocoSelecionado, 'emit');
    fixture.componentInstance.aberta.set(true);
    fixture.detectChanges();

    const acoes = BLOCOS_PAGINA.find(bloco => bloco.id === 'acoes-tela')!;
    fixture.componentInstance.selecionar(acoes);
    fixture.detectChanges();
    fixture.componentInstance.confirmarParametrizacao();

    expect(emitSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 'acoes-tela',
        html: jasmine.stringMatching(/Ações da tela.*Pesquisar/s),
      }),
    );
    expect(fixture.componentInstance.aberta()).toBe(false);
  });

  it('cancela parametrização sem emitir bloco', () => {
    const emitSpy = spyOn(fixture.componentInstance.blocoSelecionado, 'emit');
    fixture.componentInstance.aberta.set(true);
    fixture.detectChanges();

    const acoes = BLOCOS_PAGINA.find(bloco => bloco.id === 'acoes-tela')!;
    fixture.componentInstance.selecionar(acoes);
    fixture.detectChanges();
    fixture.componentInstance.cancelarParametrizacao();
    fixture.detectChanges();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.parametrizacaoAtiva()).toBeNull();
    expect(fixture.nativeElement.querySelector('.block-card')).toBeTruthy();
  });

  it('expõe blocos recomendados para redação de manuais', () => {
    const ids = BLOCOS_PAGINA.map(b => b.id);
    expect(ids).toContain('passo-a-passo');
    expect(ids).toContain('pre-requisitos');
    expect(ids).toContain('resultado-esperado');
    expect(ids).toContain('acoes-tela');
    expect(ids).toContain('kit-lista');
    expect(ids).toContain('kit-incluir');
    expect(ids).toContain('kit-editar');
    expect(ids).toContain('kit-indice');
    expect(ids).toContain('kit-menu');
    expect(ids).toContain('callout-erro');
    expect(ids).toContain('ver-tambem');
  });
});
