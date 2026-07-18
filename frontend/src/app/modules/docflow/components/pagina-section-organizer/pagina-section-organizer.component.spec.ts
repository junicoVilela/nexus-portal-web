import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  extrairSecoesPagina,
  PaginaSecaoVisual,
  PaginaSectionOrganizerComponent,
} from './pagina-section-organizer.component';

describe('PaginaSectionOrganizerComponent', () => {
  let fixture: ComponentFixture<PaginaSectionOrganizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginaSectionOrganizerComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginaSectionOrganizerComponent);
  });

  it('apresenta cada bloco visual como uma seção reordenável', () => {
    fixture.componentRef.setInput(
      'html',
      '<section><h2>Introdução</h2><p>Contexto.</p></section>' +
        '<div class="objective-card"><strong>Objetivo</strong><p>Resultado.</p></div>',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.section-organizer__item').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Introdução');
    expect(fixture.nativeElement.textContent).toContain('Objetivo');
  });

  it('agrupa título e conteúdo soltos sem misturar uma section completa', () => {
    const secoes = extrairSecoesPagina(
      '<h2>Visão geral</h2><p>Texto introdutório.</p>' +
        '<section><h2>Etapas</h2><ol><li>Primeiro</li></ol></section>' +
        '<div class="related-links"><strong>Relacionados</strong></div>',
    );

    expect(secoes.length).toBe(3);
    expect(secoes[0].titulo).toBe('Visão geral');
    expect(secoes[1].titulo).toBe('Etapas');
    expect(secoes[2].tipo).toBe('Navegação');
  });

  it('emite o HTML na nova ordem ao mover uma seção', () => {
    fixture.componentRef.setInput(
      'html',
      '<section><h2>Primeira</h2></section><section><h2>Segunda</h2></section>',
    );
    fixture.detectChanges();
    const emitSpy = spyOn(fixture.componentInstance.htmlReordenado, 'emit');

    fixture.componentInstance.mover(0, 1);

    const html = emitSpy.calls.mostRecent().args[0];
    expect(html.indexOf('Segunda')).toBeLessThan(html.indexOf('Primeira'));
  });

  it('reordena também pelo evento de arrastar e soltar', () => {
    fixture.componentRef.setInput(
      'html',
      '<section><h2>A</h2></section><section><h2>B</h2></section><section><h2>C</h2></section>',
    );
    fixture.detectChanges();
    const emitSpy = spyOn(fixture.componentInstance.htmlReordenado, 'emit');

    fixture.componentInstance.reordenar({ previousIndex: 2, currentIndex: 0 } as CdkDragDrop<
      PaginaSecaoVisual[]
    >);

    const html = emitSpy.calls.mostRecent().args[0];
    expect(html.indexOf('C')).toBeLessThan(html.indexOf('A'));
    expect(html.indexOf('A')).toBeLessThan(html.indexOf('B'));
  });

  it('duplica uma seção logo abaixo da original', () => {
    fixture.componentRef.setInput(
      'html',
      '<section><h2>Introdução</h2></section><section><h2>Etapas</h2></section>',
    );
    fixture.detectChanges();
    const emitSpy = spyOn(fixture.componentInstance.htmlReordenado, 'emit');

    fixture.componentInstance.duplicar(0);

    const html = emitSpy.calls.mostRecent().args[0];
    expect(html.match(/Introdução/g)?.length).toBe(2);
    expect(html.indexOf('Introdução')).toBeLessThan(html.indexOf('Etapas'));
  });

  it('solicita confirmação antes de excluir uma seção', () => {
    fixture.componentRef.setInput('html', '<section><h2>Introdução</h2></section>');
    fixture.detectChanges();
    const emitSpy = spyOn(fixture.componentInstance.exclusaoSolicitada, 'emit');
    const secao = fixture.componentInstance.secoes()[0];

    fixture.componentInstance.solicitarExclusao(secao);

    expect(emitSpy).toHaveBeenCalledWith(secao);
  });

  it('exclui uma seção confirmada e permite desfazer', () => {
    const htmlOriginal = '<section><h2>Introdução</h2></section><section><h2>Etapas</h2></section>';
    fixture.componentRef.setInput('html', htmlOriginal);
    fixture.detectChanges();
    const emitSpy = spyOn(fixture.componentInstance.htmlReordenado, 'emit');
    const secao = fixture.componentInstance.secoes()[0];

    expect(fixture.componentInstance.excluir(secao.id)).toBe(true);
    expect(emitSpy.calls.mostRecent().args[0]).not.toContain('Introdução');
    expect(fixture.componentInstance.podeDesfazer()).toBe(true);

    fixture.componentInstance.desfazer();
    expect(emitSpy.calls.mostRecent().args[0]).toBe(htmlOriginal);
    expect(fixture.componentInstance.podeDesfazer()).toBe(false);
  });

  it('limita o histórico às vinte alterações mais recentes', () => {
    fixture.componentRef.setInput(
      'html',
      '<section><h2>Primeira</h2></section><section><h2>Segunda</h2></section>',
    );
    fixture.detectChanges();

    for (let indice = 0; indice < 25; indice += 1) {
      fixture.componentInstance.mover(0, 1);
    }

    expect(fixture.componentInstance.historico().length).toBe(20);
  });

  it('preserva o histórico nas próprias alterações e limpa após edição externa', () => {
    const htmlOriginal = '<section><h2>Primeira</h2></section><section><h2>Segunda</h2></section>';
    fixture.componentRef.setInput('html', htmlOriginal);
    fixture.detectChanges();
    let htmlEmitido = '';
    fixture.componentInstance.htmlReordenado.subscribe(html => (htmlEmitido = html));

    fixture.componentInstance.duplicar(0);
    fixture.componentRef.setInput('html', htmlEmitido);
    fixture.detectChanges();
    expect(fixture.componentInstance.historico().length).toBe(1);

    fixture.componentRef.setInput('html', '<section><h2>Edição externa</h2></section>');
    fixture.detectChanges();
    expect(fixture.componentInstance.historico().length).toBe(0);
  });
});
