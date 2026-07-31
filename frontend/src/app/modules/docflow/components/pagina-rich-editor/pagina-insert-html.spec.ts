import { DOMParser as PmDOMParser } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOCFLOW_EDITOR_SCHEMA } from './docflow-editor.schema';
import {
  criarDocInlineDeHtml,
  extrairConteudoInlineParaCelula,
  inserirDocInlineNaSelecao,
} from './pagina-insert-html';

describe('pagina-insert-html', () => {
  it('extrai um único status-badge', () => {
    expect(extrairConteudoInlineParaCelula('<span class="status-badge status-badge--sim">Sim</span>')).toContain(
      'status-badge--sim',
    );
  });

  it('com vários badges, devolve o primeiro', () => {
    const html =
      '<section><span class="status-badge status-badge--sim">Sim</span>' +
      '<span class="status-badge status-badge--nao">Não</span></section>';
    const out = extrairConteudoInlineParaCelula(html);
    expect(out).toContain('Sim');
    expect(out).not.toContain('Não');
  });

  it('não extrai seção/tabela sem badge', () => {
    expect(extrairConteudoInlineParaCelula('<section class="doc-section"><h2>Título</h2></section>')).toBeNull();
  });

  it('cria doc_inline com classes do badge', () => {
    const state = EditorState.create({ schema: DOCFLOW_EDITOR_SCHEMA });
    const node = criarDocInlineDeHtml(state, '<span class="status-badge status-badge--sim">Sim</span>');
    expect(node?.type.name).toBe('doc_inline');
    expect(node?.attrs['class']).toBe('status-badge status-badge--sim');
    expect(node?.textContent).toBe('Sim');
  });

  it('insere badge colorido sem perder o wrapper', () => {
    const el = document.createElement('div');
    el.innerHTML = '<p>aqui</p>';
    const doc = PmDOMParser.fromSchema(DOCFLOW_EDITOR_SCHEMA).parse(el);
    const state = EditorState.create({
      schema: DOCFLOW_EDITOR_SCHEMA,
      doc,
      selection: TextSelection.create(doc, 1),
    });
    const place = document.createElement('div');
    document.body.appendChild(place);
    const view = new EditorView(place, { state });
    try {
      inserirDocInlineNaSelecao(view, '<span class="status-badge status-badge--ativo">Ativo</span>');
      expect(view.dom.innerHTML).toContain('status-badge--ativo');
      expect(view.dom.innerHTML).toContain('Ativo');
    } finally {
      view.destroy();
      place.remove();
    }
  });
});
