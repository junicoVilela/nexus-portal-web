import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlocoPagina, CategoriaBlocoPagina } from './pagina-block-library.blocks';
import { PaginaBlockLibraryComponent } from './pagina-block-library.component';

const bloco = (
  id: string,
  nome: string,
  categoria: CategoriaBlocoPagina,
  parametrizacao?: BlocoPagina['parametrizacao'],
): BlocoPagina => ({
  id,
  nome,
  descricao: `Descrição de ${nome}`,
  categoria,
  visual: categoria === 'Kits' ? 'kit' : 'intro',
  parametrizacao,
  html:
    parametrizacao === 'acoes-tela'
      ? '<section><h2>Ações da tela</h2><table><tbody><tr><td>Pesquisar</td></tr></tbody></table></section>'
      : `<section><h2>${nome}</h2><p>Conteúdo</p></section>`,
});

const BLOCOS_TESTE: readonly BlocoPagina[] = [
  bloco('introducao', 'Introdução editorial', 'Estrutura'),
  bloco('objetivo', 'Objetivo de negócio', 'Orientação'),
  bloco('passo-a-passo', 'Passo a passo', 'Estrutura'),
  bloco('pre-requisitos', 'Pré-requisitos', 'Orientação'),
  bloco('resultado-esperado', 'Resultado esperado', 'Orientação'),
  bloco('acoes-tela', 'Ações da tela', 'Referência', 'acoes-tela'),
  bloco('dicionario', 'Dicionário de campos', 'Referência'),
  bloco('se-entao', 'SE → ENTÃO', 'Orientação'),
  bloco('callout-erro', 'Callout · Erro comum', 'Orientação'),
  bloco('ver-tambem', 'Ver também', 'Navegação'),
  bloco('kit-lista', 'Kit · Página de lista', 'Kits'),
  bloco('kit-incluir', 'Kit · Página de inclusão', 'Kits'),
  bloco('kit-editar', 'Kit · Página de edição', 'Kits'),
  bloco('kit-indice', 'Kit · Índice de operações', 'Kits'),
  bloco('kit-menu', 'Kit · Menu / pasta', 'Kits'),
];

describe('PaginaBlockLibraryComponent', () => {
  let fixture: ComponentFixture<PaginaBlockLibraryComponent>;

  beforeEach(async () => {
    localStorage.removeItem('docflow:blocos-recentes');
    await TestBed.configureTestingModule({ imports: [PaginaBlockLibraryComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginaBlockLibraryComponent);
    fixture.componentRef.setInput('blocosCatalogo', BLOCOS_TESTE);
    fixture.detectChanges();
  });

  it('abre a biblioteca e apresenta os blocos disponíveis', () => {
    (fixture.nativeElement.querySelector('.block-library__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.block-card').length).toBe(BLOCOS_TESTE.length);
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
      BLOCOS_TESTE.filter(b => b.categoria === 'Navegação').length,
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

    const acoes = BLOCOS_TESTE.find(item => item.id === 'acoes-tela')!;
    fixture.componentInstance.selecionar(acoes);
    fixture.detectChanges();

    expect(fixture.componentInstance.parametrizacaoAtiva()).toBe('acoes-tela');
    expect(fixture.nativeElement.textContent).toContain('Personalizar bloco');
    expect(
      fixture.nativeElement.querySelectorAll('.block-library__param-table input').length,
    ).toBeGreaterThan(0);
  });

  it('confirma parametrização e emite bloco com HTML gerado', () => {
    const emitSpy = spyOn(fixture.componentInstance.blocoSelecionado, 'emit');
    fixture.componentInstance.aberta.set(true);
    fixture.detectChanges();

    const acoes = BLOCOS_TESTE.find(item => item.id === 'acoes-tela')!;
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

    const acoes = BLOCOS_TESTE.find(item => item.id === 'acoes-tela')!;
    fixture.componentInstance.selecionar(acoes);
    fixture.detectChanges();
    fixture.componentInstance.cancelarParametrizacao();
    fixture.detectChanges();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.parametrizacaoAtiva()).toBeNull();
    expect(fixture.nativeElement.querySelector('.block-card')).toBeTruthy();
  });

  it('expõe blocos recomendados para redação de manuais', () => {
    const ids = BLOCOS_TESTE.map(b => b.id);
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
