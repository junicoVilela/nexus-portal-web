import { Node as ProseMirrorNode, DOMParser as PmDOMParser } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { DOCFLOW_EDITOR_SCHEMA } from './docflow-editor.schema';
import {
  adicionarLinha,
  adicionarColuna,
  contextoTabela,
  podeAdicionarColuna,
  podeRemoverColuna,
  podeRemoverLinha,
  removerColuna,
  removerLinha,
} from './pagina-rich-editor-table';

function estadoComTabela(html: string, cursorInTbody = true): EditorState {
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const doc = PmDOMParser.fromSchema(DOCFLOW_EDITOR_SCHEMA).parse(wrap);
  let state = EditorState.create({ schema: DOCFLOW_EDITOR_SCHEMA, doc });
  let targetPos = 1;
  doc.descendants((node, pos) => {
    if (node.type.name !== 'table_cell' && node.type.name !== 'table_header') return true;
    const $pos = doc.resolve(pos);
    let inBody = false;
    for (let depth = $pos.depth; depth > 0; depth--) {
      if ($pos.node(depth).type.name === 'table_body') {
        inBody = true;
        break;
      }
    }
    if (cursorInTbody ? inBody : !inBody) {
      targetPos = pos + 1;
      return false;
    }
    return true;
  });
  state = state.apply(state.tr.setSelection(TextSelection.near(state.doc.resolve(targetPos))));
  return state;
}

function corpoTabela(doc: ProseMirrorNode): ProseMirrorNode | null {
  let found: ProseMirrorNode | null = null;
  doc.descendants(node => {
    if (node.type.name === 'table_body') {
      found = node;
      return false;
    }
    return true;
  });
  return found;
}

describe('pagina-rich-editor-table', () => {
  const tabelaHtml =
    '<div class="table-wrap"><table><thead><tr><th>Campo</th><th>Descrição</th></tr></thead>' +
    '<tbody><tr><td><span class="number-badge">1</span></td><td>Nome</td></tr></tbody></table></div>';

  it('detecta o contexto quando o cursor está na tabela', () => {
    const state = estadoComTabela(tabelaHtml);
    const ctx = contextoTabela(state);
    expect(ctx?.sectionName).toBe('table_body');
    expect(ctx?.colCount).toBe(2);
  });

  it('adiciona uma linha no tbody com badge sequencial', () => {
    let state = estadoComTabela(tabelaHtml);
    expect(adicionarLinha(state, tr => (state = state.apply(tr)))).toBe(true);

    const body = corpoTabela(state.doc);
    expect(body?.childCount).toBe(2);
    expect(body?.child(1).textContent).toContain('2');
  });

  it('não remove a única linha do tbody', () => {
    const state = estadoComTabela(tabelaHtml);
    expect(podeRemoverLinha(state)).toBe(false);
    expect(removerLinha(state)).toBe(false);
  });

  it('remove linha extra e mantém ao menos uma linha', () => {
    let state = estadoComTabela(tabelaHtml);
    adicionarLinha(state, tr => (state = state.apply(tr)));
    expect(podeRemoverLinha(state)).toBe(true);
    expect(removerLinha(state, tr => (state = state.apply(tr)))).toBe(true);
    expect(corpoTabela(state.doc)?.childCount).toBe(1);
  });

  it('adiciona e remove coluna mantendo ao menos uma', () => {
    let state = estadoComTabela(tabelaHtml);
    expect(podeAdicionarColuna(state)).toBe(true);
    expect(adicionarColuna(state, tr => (state = state.apply(tr)))).toBe(true);
    expect(contextoTabela(state)?.colCount).toBe(3);
    expect(podeRemoverColuna(state)).toBe(true);
    expect(removerColuna(state, tr => (state = state.apply(tr)))).toBe(true);
    expect(contextoTabela(state)?.colCount).toBe(2);
  });
});
