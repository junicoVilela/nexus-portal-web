import { DOMParser as PmDOMParser, Fragment, Node as ProseMirrorNode, Slice } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

/** Adapta HTML da biblioteca de blocos ao contexto da seleção (célula vs. corpo). */

/** Se o snippet tiver selos/badges, devolve HTML inline adequado para célula de tabela. */
export function extrairConteudoInlineParaCelula(html: string): string | null {
  if (!html?.trim()) return null;
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return null;

  const badges = Array.from(root.querySelectorAll('.status-badge, .number-badge, .filter-chip'));
  if (badges.length === 1) return badges[0].outerHTML;
  if (badges.length > 1) {
    // Bloco-demo com vários selos: usa o primeiro (há blocos individuais para os demais).
    return badges[0].outerHTML;
  }

  // Snippet já é só inline (span/strong/texto), sem seção/tabela.
  const temBloco = !!root.querySelector('section, table, thead, tbody, ul, ol, h1, h2, h3, figure');
  if (!temBloco) {
    const texto = root.innerHTML.trim();
    return texto || null;
  }

  return null;
}

/**
 * Insere HTML na seleção. Fatias "abertas" do parseSlice descartam wrappers inline
 * (ex.: span.status-badge vira só texto) — por isso fechamos openStart/openEnd.
 */
export function inserirHtmlNaSelecao(view: EditorView, html: string): boolean {
  const { state } = view;
  const element = document.createElement('div');
  element.innerHTML = html.trim();
  const parsed = PmDOMParser.fromSchema(state.schema).parseSlice(element);
  const slice = new Slice(parsed.content, 0, 0);
  const tr = state.tr.replaceRange(state.selection.from, state.selection.to, slice);
  view.dispatch(tr.scrollIntoView());
  return true;
}

/** Monta um nó doc_inline a partir de um <span class="..."> — fallback robusto. */
export function criarDocInlineDeHtml(state: EditorState, html: string): ProseMirrorNode | null {
  const inline = state.schema.nodes['doc_inline'];
  if (!inline) return null;
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const span = doc.getElementById('root')?.querySelector('span[class]');
  if (!span) return null;
  const className = span.getAttribute('class');
  const texto = span.textContent ?? '';
  return inline.create({ class: className }, texto ? state.schema.text(texto) : Fragment.empty);
}

export function inserirDocInlineNaSelecao(view: EditorView, html: string): boolean {
  const node = criarDocInlineDeHtml(view.state, html);
  if (!node) return false;
  const tr: Transaction = view.state.tr.replaceSelectionWith(node, false);
  view.dispatch(tr.scrollIntoView());
  return true;
}
