import { Fragment, Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';

export interface ContextoTabela {
  tablePos: number;
  tableNode: ProseMirrorNode;
  sectionPos: number;
  sectionNode: ProseMirrorNode;
  sectionName: 'table_head' | 'table_body';
  rowPos: number;
  rowNode: ProseMirrorNode;
  rowIndex: number;
  colCount: number;
}

export function contextoTabela(state: EditorState): ContextoTabela | null {
  const selection = state.selection;
  if (!selection?.$from) return null;
  const $from = selection.$from;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name !== 'table_row') continue;

    const section = $from.node(depth - 1);
    const sectionName = section.type.name;
    if (sectionName !== 'table_head' && sectionName !== 'table_body') return null;

    const table = $from.node(depth - 2);
    if (table.type.name !== 'table') return null;

    return {
      tablePos: $from.before(depth - 2),
      tableNode: table,
      sectionPos: $from.before(depth - 1),
      sectionNode: section,
      sectionName,
      rowPos: $from.before(depth),
      rowNode: node,
      rowIndex: $from.index(depth - 1),
      colCount: node.childCount,
    };
  }
  return null;
}

export function podeAdicionarLinha(state: EditorState): boolean {
  return contextoTabela(state) !== null;
}

export function podeRemoverLinha(state: EditorState): boolean {
  const ctx = contextoTabela(state);
  if (!ctx || ctx.sectionName !== 'table_body') return false;
  return ctx.sectionNode.childCount > 1;
}

function celulaVazia(schema: Schema, badge?: number): ProseMirrorNode {
  const paragraph = schema.nodes['paragraph'];
  const cell = schema.nodes['table_cell'];
  if (!paragraph || !cell) {
    throw new Error('Schema sem paragraph/table_cell');
  }
  if (badge != null && schema.nodes['doc_inline']) {
    const badgeNode = schema.nodes['doc_inline'].create(
      { class: 'number-badge' },
      schema.text(String(badge)),
    );
    return cell.create(null, paragraph.create(null, badgeNode));
  }
  return cell.createAndFill() ?? cell.create(null, paragraph.create());
}

function criarLinha(schema: Schema, colCount: number, badge?: number): ProseMirrorNode {
  const rowType = schema.nodes['table_row'];
  if (!rowType) throw new Error('Schema sem table_row');
  const cells: ProseMirrorNode[] = [];
  for (let i = 0; i < colCount; i++) {
    cells.push(celulaVazia(schema, i === 0 ? badge : undefined));
  }
  return rowType.create(null, Fragment.from(cells));
}

function proximoNumeroBadge(section: ProseMirrorNode): number {
  let max = 0;
  section.forEach(row => {
    const texto = row.firstChild?.textContent?.trim() ?? '';
    const n = Number.parseInt(texto, 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  });
  return max + 1;
}

function corpoDaTabela(table: ProseMirrorNode): { node: ProseMirrorNode; offset: number } | null {
  let offset = 0;
  for (let i = 0; i < table.childCount; i++) {
    const child = table.child(i);
    if (child.type.name === 'table_body') {
      return { node: child, offset };
    }
    offset += child.nodeSize;
  }
  return null;
}

function posInsercaoAposLinha(sectionPos: number, section: ProseMirrorNode, rowIndex: number): number {
  let insertPos = sectionPos + 1;
  const limite = Math.min(rowIndex + 1, section.childCount);
  for (let i = 0; i < limite; i++) {
    insertPos += section.child(i).nodeSize;
  }
  return insertPos;
}

export function adicionarLinha(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const ctx = contextoTabela(state);
  if (!ctx) return false;

  const schema = state.schema;
  let sectionPos = ctx.sectionPos;
  let sectionNode = ctx.sectionNode;
  let rowIndex = ctx.rowIndex;

  if (ctx.sectionName === 'table_head') {
    const body = corpoDaTabela(ctx.tableNode);
    if (!body) return false;
    sectionPos = ctx.tablePos + 1 + body.offset;
    sectionNode = body.node;
    rowIndex = Math.max(body.node.childCount - 1, -1);
  }

  const colCount = Math.max(ctx.colCount, sectionNode.firstChild?.childCount ?? 0, 1);
  const badge = proximoNumeroBadge(sectionNode);
  const novaLinha = criarLinha(schema, colCount, badge);
  const insertPos = posInsercaoAposLinha(sectionPos, sectionNode, rowIndex);

  if (!dispatch) return true;

  const tr = state.tr.insert(insertPos, novaLinha);
  tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)));
  tr.scrollIntoView();
  dispatch(tr);
  return true;
}

export function removerLinha(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const ctx = contextoTabela(state);
  if (!ctx || ctx.sectionName !== 'table_body' || ctx.sectionNode.childCount <= 1) {
    return false;
  }

  if (!dispatch) return true;

  const from = ctx.rowPos;
  const to = ctx.rowPos + ctx.rowNode.nodeSize;
  const tr = state.tr.delete(from, to);
  renumerarBadgesNoDoc(tr, Math.min(from, tr.doc.content.size));
  const selPos = Math.min(from, tr.doc.content.size - 1);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(1, selPos))));
  tr.scrollIntoView();
  dispatch(tr);
  return true;
}

function renumerarBadgesNoDoc(tr: Transaction, aroundPos: number): void {
  const pos = Math.min(Math.max(1, aroundPos), tr.doc.content.size);
  const $pos = tr.doc.resolve(pos);
  let bodyPos: number | null = null;
  let bodyNode: ProseMirrorNode | null = null;

  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === 'table_body') {
      bodyPos = $pos.before(depth);
      bodyNode = node;
      break;
    }
  }

  if (bodyPos == null || !bodyNode) {
    tr.doc.nodesBetween(0, tr.doc.content.size, (node, nodePos) => {
      if (bodyPos != null) return false;
      if (node.type.name === 'table_body') {
        bodyPos = nodePos;
        bodyNode = node;
        return false;
      }
      return true;
    });
  }

  if (bodyPos == null || !bodyNode) return;

  const substituicoes: { from: number; to: number; node: ProseMirrorNode }[] = [];
  let offset = bodyPos + 1;
  for (let rowIndex = 0; rowIndex < bodyNode.childCount; rowIndex++) {
    const row = bodyNode.child(rowIndex);
    const cell = row.firstChild;
    if (cell) {
      const cellFrom = offset + 1;
      const cellTo = cellFrom + cell.nodeSize;
      tr.doc.nodesBetween(cellFrom, cellTo, (node, nodePos) => {
        if (node.type.name === 'doc_inline' && node.attrs['class'] === 'number-badge') {
          substituicoes.push({
            from: nodePos,
            to: nodePos + node.nodeSize,
            node: node.type.create(node.attrs, tr.doc.type.schema.text(String(rowIndex + 1))),
          });
          return false;
        }
        return true;
      });
    }
    offset += row.nodeSize;
  }

  for (const item of substituicoes.sort((a, b) => b.from - a.from)) {
    tr.replaceWith(item.from, item.to, item.node);
  }
}
