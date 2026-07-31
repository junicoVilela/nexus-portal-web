import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { lucideTestIcons } from 'src/testing/lucide-test-icons';
import { PaginaRichEditorComponent } from './pagina-rich-editor.component';

describe('PaginaRichEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaRichEditorComponent],
      providers: [lucideTestIcons],
    }).compileComponents();
  });

  it('mantém a classe visual do conteúdo dentro do editor', async () => {
    const fixture = TestBed.createComponent(PaginaRichEditorComponent);
    fixture.componentRef.setInput(
      'control',
      new FormControl(
        '<div class="callout"><strong>Dica</strong><p>Orientação.</p></div>' +
          '<div class="table-wrap"><table><thead><tr><th>Campo</th></tr></thead>' +
          '<tbody><tr><td>Nome</td></tr></tbody></table></div>' +
          '<section class="steps"><ol><li>Primeiro passo</li></ol></section>' +
          '<ul class="checklist"><li>Pré-requisito</li></ul>',
        { nonNullable: true },
      ),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ngx-editor.df-doc-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.df-table-tools')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.NgxEditor__Content .callout')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.NgxEditor__Content .table-wrap table th')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.NgxEditor__Content .steps > ol > li')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.NgxEditor__Content ul.checklist')).not.toBeNull();
  });

  it('insere HTML de bloco na seleção atual do editor', async () => {
    const fixture = TestBed.createComponent(PaginaRichEditorComponent);
    fixture.componentRef.setInput('control', new FormControl('<p>base</p>', { nonNullable: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.guardarSelecao();
    component.inserirHtml('<div class="callout"><strong>Dica</strong><p>Orientação.</p></div>');

    expect(component.control().value).toContain('callout');
  });
  it('abre a biblioteca ao digitar barra em um parágrafo vazio', async () => {
    const fixture = TestBed.createComponent(PaginaRichEditorComponent);
    fixture.componentRef.setInput('control', new FormControl('', { nonNullable: true }));
    fixture.detectChanges();
    const emitSpy = spyOn(fixture.componentInstance.slashSolicitado, 'emit');
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });

    fixture.componentInstance.aoPressionarTecla(event);

    expect(event.defaultPrevented).toBe(true);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('mantém a barra normal quando já existe texto antes do cursor', async () => {
    const fixture = TestBed.createComponent(PaginaRichEditorComponent);
    fixture.componentRef.setInput('control', new FormControl('<p>https:</p>', { nonNullable: true }));
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.editor = {
      view: {
        state: {
          selection: {
            empty: true,
            $from: {
              parentOffset: 6,
              parent: { textBetween: () => 'https:' },
            },
          },
        },
      },
      destroy: () => undefined,
    } as never;
    const emitSpy = spyOn(component.slashSolicitado, 'emit');
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });

    component.aoPressionarTecla(event);

    expect(event.defaultPrevented).toBe(false);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('preserva os blocos visuais do portal de ajuda durante a edição', async () => {
    const fixture = TestBed.createComponent(PaginaRichEditorComponent);
    fixture.componentRef.setInput(
      'control',
      new FormControl(
        '<div class="objective-card"><p><strong>Objetivo</strong></p><p>Orientação.</p></div>' +
          '<div class="annotation-grid"><article class="annotation-card"><h3>Filtro</h3><p>Descrição.</p></article></div>' +
          '<ol class="flow-strip"><li><p><strong>Acessar</strong></p><p>Abra a tela.</p></li></ol>',
        { nonNullable: true },
      ),
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.NgxEditor__Content .objective-card')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.NgxEditor__Content .annotation-grid .annotation-card'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.NgxEditor__Content ol.flow-strip > li')).not.toBeNull();
  });

  it('preserva jornada, lista de conteúdos e checklist de status', async () => {
    const fixture = TestBed.createComponent(PaginaRichEditorComponent);
    fixture.componentRef.setInput(
      'control',
      new FormControl(
        '<div class="journey-grid"><article class="journey-card"><span class="journey-card__number">1</span><h3>Acesso</h3><p>Entre no sistema.</p></article></div>' +
          '<div class="resource-list"><article class="resource-item"><p><strong>Guia</strong></p><p>Resumo.</p></article></div>' +
          '<ul class="status-list"><li class="status-item status-item--done"><p>Configurar</p><p><strong>Concluído</strong></p></li></ul>',
        { nonNullable: true },
      ),
    );

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.NgxEditor__Content .journey-grid .journey-card'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.NgxEditor__Content .journey-card__number')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.NgxEditor__Content .resource-list .resource-item'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.NgxEditor__Content ul.status-list > li.status-item--done'),
    ).not.toBeNull();
  });
});
