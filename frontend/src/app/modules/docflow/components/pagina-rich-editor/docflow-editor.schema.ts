import { DOMOutputSpec, Node as ProseMirrorNode, NodeSpec, Schema } from 'prosemirror-model';
import { marks, nodes as baseNodes } from 'ngx-editor/schema';

interface ElementAttrs {
  tag: string;
  class: string | null;
}

function cssClass(dom: Node | string): string | null {
  return dom instanceof HTMLElement ? dom.getAttribute('class') : null;
}

function containerRule(tag: string) {
  return {
    tag,
    getAttrs: (dom: Node | string): ElementAttrs => ({ tag, class: cssClass(dom) }),
  };
}

const docContainer: NodeSpec = {
  attrs: {
    tag: { default: 'div' },
    class: { default: null },
  },
  content: 'block+',
  group: 'block',
  defining: true,
  parseDOM: ['section', 'article', 'div', 'figure'].map(containerRule),
  toDOM(node: ProseMirrorNode): DOMOutputSpec {
    const attrs = node.attrs as ElementAttrs;
    return [attrs.tag, { class: attrs.class }, 0];
  },
};

const docInline: NodeSpec = {
  attrs: { class: { default: null } },
  content: 'inline*',
  group: 'inline',
  inline: true,
  parseDOM: [
    {
      tag: 'span[class]',
      priority: 60,
      getAttrs: dom => ({ class: cssClass(dom) }),
    },
  ],
  toDOM(node: ProseMirrorNode): DOMOutputSpec {
    return ['span', { class: node.attrs['class'] as string | null }, 0];
  },
};

const table: NodeSpec = {
  content: 'table_head? table_body+',
  group: 'block',
  isolating: true,
  parseDOM: [{ tag: 'table' }],
  toDOM: () => ['table', 0],
};

const tableHead: NodeSpec = {
  content: 'table_row+',
  isolating: true,
  parseDOM: [{ tag: 'thead' }],
  toDOM: () => ['thead', 0],
};

const tableBody: NodeSpec = {
  content: 'table_row+',
  isolating: true,
  parseDOM: [{ tag: 'tbody' }],
  toDOM: () => ['tbody', 0],
};

const tableRow: NodeSpec = {
  content: '(table_header | table_cell)+',
  isolating: true,
  parseDOM: [{ tag: 'tr' }],
  toDOM: () => ['tr', 0],
};

const tableHeader: NodeSpec = {
  /* Um único parágrafo evita Enter criar blocos vazios (linhas altíssimas). */
  content: 'paragraph',
  isolating: true,
  parseDOM: [{ tag: 'th' }],
  toDOM: () => ['th', 0],
};

const tableCell: NodeSpec = {
  content: 'paragraph',
  isolating: true,
  parseDOM: [{ tag: 'td' }],
  toDOM: () => ['td', 0],
};

const figcaption: NodeSpec = {
  content: 'inline*',
  group: 'block',
  parseDOM: [{ tag: 'figcaption' }],
  toDOM: () => ['figcaption', 0],
};

const orderedList: NodeSpec = {
  ...baseNodes.ordered_list,
  attrs: {
    ...baseNodes.ordered_list.attrs,
    class: { default: null },
  },
  parseDOM: [
    {
      tag: 'ol',
      getAttrs: dom => ({
        order:
          dom instanceof HTMLElement && dom.hasAttribute('start') ? Number(dom.getAttribute('start')) : 1,
        class: cssClass(dom),
      }),
    },
  ],
  toDOM(node: ProseMirrorNode): DOMOutputSpec {
    const order = node.attrs['order'] as number;
    return ['ol', { start: order === 1 ? null : order, class: node.attrs['class'] as string | null }, 0];
  },
};

const bulletList: NodeSpec = {
  ...baseNodes.bullet_list,
  attrs: {
    ...baseNodes.bullet_list.attrs,
    class: { default: null },
  },
  parseDOM: [{ tag: 'ul', getAttrs: dom => ({ class: cssClass(dom) }) }],
  toDOM: (node: ProseMirrorNode): DOMOutputSpec => ['ul', { class: node.attrs['class'] as string | null }, 0],
};

const listItem: NodeSpec = {
  ...baseNodes.list_item,
  attrs: {
    ...baseNodes.list_item.attrs,
    class: { default: null },
  },
  parseDOM: [{ tag: 'li', getAttrs: dom => ({ class: cssClass(dom) }) }],
  toDOM: (node: ProseMirrorNode): DOMOutputSpec => ['li', { class: node.attrs['class'] as string | null }, 0],
};

export const DOCFLOW_EDITOR_SCHEMA = new Schema({
  nodes: {
    ...baseNodes,
    ordered_list: orderedList,
    bullet_list: bulletList,
    list_item: listItem,
    doc_container: docContainer,
    doc_inline: docInline,
    table,
    table_head: tableHead,
    table_body: tableBody,
    table_row: tableRow,
    table_header: tableHeader,
    table_cell: tableCell,
    figcaption,
  },
  marks,
});
