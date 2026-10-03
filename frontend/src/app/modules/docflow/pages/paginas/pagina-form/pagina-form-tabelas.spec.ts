import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { PaginaRichEditorComponent } from '@modules/docflow/components/pagina-rich-editor';
import { ToastService } from '@shared/ui';
import { PaginaFormTabelas } from './pagina-form-tabelas';

describe('PaginaFormTabelas', () => {
  const tabela = '<table><thead><tr><th>Campo</th></tr></thead><tbody><tr><td>Nome</td></tr></tbody></table>';
  let tabelas: PaginaFormTabelas;
  let toast: jasmine.SpyObj<ToastService>;
  let conteudo: FormControl<string>;
  let alterado: jasmine.Spy;
  let editor: PaginaRichEditorComponent | undefined;

  beforeEach(() => {
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['warn']);
    TestBed.configureTestingModule({
      providers: [PaginaFormTabelas, { provide: ToastService, useValue: toast }],
    });
    tabelas = TestBed.inject(PaginaFormTabelas);
    conteudo = new FormControl(tabela, { nonNullable: true });
    alterado = jasmine.createSpy('alterado');
    editor = undefined;
    tabelas.configurar({ conteudo, editorRico: () => editor, previaRoot: () => undefined, alterado });
  });

  it('sem tabela no conteúdo só avisa', () => {
    conteudo.setValue('<p>Sem tabela</p>');
    tabelas.alterar('linha', 'add');
    expect(toast.warn).toHaveBeenCalled();
    expect(alterado).not.toHaveBeenCalled();
  });

  it('fora do editor rico altera o HTML e marca o conteúdo como alterado', () => {
    tabelas.alterar('linha', 'add');
    expect((conteudo.value.match(/<tr>/g) ?? []).length).toBe(3);
    expect(alterado).toHaveBeenCalled();
  });

  it('com seleção numa tabela do editor rico, delega ao editor', () => {
    const rico = jasmine.createSpyObj<PaginaRichEditorComponent>('editor', [
      'podeAdicionar',
      'adicionarLinhaTabela',
      'aplicarHtml',
    ]);
    rico.podeAdicionar.and.returnValue(true);
    editor = rico;

    tabelas.alterar('linha', 'add');

    expect(rico.adicionarLinhaTabela).toHaveBeenCalled();
    expect(conteudo.value).toBe(tabela);
  });

  it('botão da prévia vira a ação na tabela indicada', () => {
    const alterar = spyOn(tabelas, 'alterar');
    const botao = document.createElement('button');
    botao.dataset['tableAction'] = 'remove-col';
    botao.dataset['tableIndex'] = '2';
    const evento = { target: botao, preventDefault: jasmine.createSpy() } as unknown as MouseEvent;

    tabelas.aoClicarPrevia(evento);

    expect(alterar).toHaveBeenCalledWith('coluna', 'remove', 2);
  });
});
