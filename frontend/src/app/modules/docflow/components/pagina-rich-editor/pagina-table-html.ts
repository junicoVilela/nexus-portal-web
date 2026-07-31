/** Manipula linhas de <table> em HTML serializado (prévia / modo código). */

const LINHA_DICIONARIO = (n: number, colunas: number): string => {
  const celulas = Array.from({ length: Math.max(colunas, 1) }, (_, i) => {
    if (i === 0) return `<td><span class="number-badge">${n}</span></td>`;
    if (i === 1) return `<td><strong>Nome do campo</strong></td>`;
    if (i === 2) return `<td>Explique sua finalidade.</td>`;
    if (i === 3) return `<td><span class="status-badge status-badge--sim">Sim</span></td>`;
    if (i === 4) return `<td>Valor de exemplo</td>`;
    if (i === 5) return `<td>Descreva o impacto no negócio.</td>`;
    return `<td></td>`;
  });
  return `<tr>${celulas.join('')}</tr>`;
};

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
}

function serializeRoot(doc: Document): string {
  const root = doc.getElementById('root');
  return root?.innerHTML ?? '';
}

function tabelas(doc: Document): HTMLTableElement[] {
  const root = doc.getElementById('root');
  return root ? Array.from(root.querySelectorAll('table')) : [];
}

function contagemColunas(table: HTMLTableElement): number {
  const ref = table.querySelector('thead tr') ?? table.querySelector('tbody tr') ?? table.querySelector('tr');
  return ref?.children.length || 1;
}

function renumerarBadges(tbody: HTMLTableSectionElement): void {
  Array.from(tbody.rows).forEach((row, index) => {
    const badge = row.querySelector('.number-badge');
    if (badge) badge.textContent = String(index + 1);
  });
}

function paragrafoTemConteudo(p: Element): boolean {
  const texto = (p.textContent ?? '').replace(/\u00a0/g, ' ').trim();
  if (texto) return true;
  return !!p.querySelector(
    'img, svg, video, iframe, .number-badge, .status-badge, strong, em, a, code, span[class], ul, ol, input',
  );
}

/** Remove <br> extras no fim do parágrafo (esticam a linha da tabela). */
function limparQuebrasExtras(p: Element): void {
  const nodes = Array.from(p.childNodes);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.nodeType === Node.TEXT_NODE) {
      const texto = (node.textContent ?? '').replace(/\u00a0/g, ' ');
      if (!texto.trim()) {
        node.remove();
        continue;
      }
      break;
    }
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'BR') {
      node.remove();
      continue;
    }
    break;
  }
}

function compactarCelula(cell: Element): void {
  const paragrafos = Array.from(cell.querySelectorAll('p'));
  paragrafos.forEach(limparQuebrasExtras);

  const diretos = Array.from(cell.children).filter(el => el.tagName === 'P');
  if (diretos.length > 0) {
    const comConteudo = diretos.filter(paragrafoTemConteudo);
    if (comConteudo.length === 0) {
      diretos.slice(1).forEach(p => p.remove());
      const unico = diretos[0];
      if (unico) unico.innerHTML = '';
    } else {
      diretos.forEach(p => {
        if (!comConteudo.includes(p)) p.remove();
      });
    }
  }

  // <br> soltos na célula (fora de <p>) também esticam a linha
  Array.from(cell.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'BR') {
      node.remove();
    }
  });
}

/** Compacta células de tabelas em um fragmento/elemento já montado no DOM. */
export function compactarCelulasTabelaNoDom(root: ParentNode): void {
  root.querySelectorAll('td, th').forEach(compactarCelula);
}

/** Remove <p> vazios extras dentro de td/th (causa de linhas altíssimas no dicionário). */
export function compactarCelulasTabelaHtml(html: string): string {
  if (!html?.includes('<t')) return html;
  const doc = parseHtml(html);
  const root = doc.getElementById('root');
  if (!root) return html;
  compactarCelulasTabelaNoDom(root);
  return serializeRoot(doc);
}

export function adicionarLinhaHtml(html: string, tableIndex = 0): string {
  const doc = parseHtml(compactarCelulasTabelaHtml(html));
  const table = tabelas(doc)[tableIndex];
  if (!table) return html;

  let tbody = table.tBodies[0];
  if (!tbody) {
    tbody = doc.createElement('tbody');
    table.appendChild(tbody);
  }

  const cols = contagemColunas(table);
  const wrap = doc.createElement('tbody');
  wrap.innerHTML = LINHA_DICIONARIO(tbody.rows.length + 1, cols);
  const nova = wrap.querySelector('tr');
  if (nova) tbody.appendChild(nova);
  renumerarBadges(tbody);
  return serializeRoot(doc);
}

export function removerUltimaLinhaHtml(html: string, tableIndex = 0): string {
  const doc = parseHtml(html);
  const table = tabelas(doc)[tableIndex];
  const tbody = table?.tBodies[0];
  if (!tbody || tbody.rows.length <= 1) return html;
  tbody.deleteRow(tbody.rows.length - 1);
  renumerarBadges(tbody);
  return serializeRoot(doc);
}

export function contagemTabelasHtml(html: string): number {
  return tabelas(parseHtml(html)).length;
}
