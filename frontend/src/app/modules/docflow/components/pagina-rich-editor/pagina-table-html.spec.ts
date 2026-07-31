import {
  adicionarColunaHtml,
  adicionarLinhaHtml,
  compactarCelulasTabelaHtml,
  contagemTabelasHtml,
  removerColunaHtml,
  removerUltimaLinhaHtml,
} from './pagina-table-html';

describe('pagina-table-html', () => {
  const html =
    '<section><h2>Dicionário</h2><div class="table-wrap"><table><thead><tr><th>#</th><th>Campo</th></tr></thead>' +
    '<tbody><tr><td><span class="number-badge">1</span></td><td>Nome</td></tr></tbody></table></div></section>';

  it('conta tabelas no HTML', () => {
    expect(contagemTabelasHtml(html)).toBe(1);
  });

  it('adiciona linha com badge sequencial', () => {
    const atualizado = adicionarLinhaHtml(html);
    expect(atualizado).toContain('number-badge">2<');
    expect((atualizado.match(/<tr>/g) ?? []).length).toBe(3); // thead + 2 body
  });

  it('não remove a última linha restante', () => {
    expect(removerUltimaLinhaHtml(html)).toBe(html);
  });

  it('remove linha extra', () => {
    const comDuas = adicionarLinhaHtml(html);
    const uma = removerUltimaLinhaHtml(comDuas);
    expect(uma).toContain('number-badge">1<');
    expect(uma).not.toContain('number-badge">2<');
  });

  it('remove parágrafos vazios extras nas células', () => {
    const inchado =
      '<table><tbody><tr>' +
      '<td><p><span class="number-badge">1</span></p><p></p><p><br></p></td>' +
      '<td><p><strong>Nome</strong></p><p>&nbsp;</p><p><br class="ProseMirror-trailingBreak"></p></td>' +
      '</tr></tbody></table>';
    const compacto = compactarCelulasTabelaHtml(inchado);
    expect(compacto).toContain('number-badge');
    expect(compacto).toContain('<strong>Nome</strong>');
    expect((compacto.match(/<p>/g) ?? []).length).toBe(2);
  });

  it('remove <br> extras que esticam a linha', () => {
    const inchado =
      '<table><tbody><tr>' +
      '<td><p>Nome<br><br><br></p></td>' +
      '<td><p>Descrição</p><br><br></td>' +
      '</tr></tbody></table>';
    const compacto = compactarCelulasTabelaHtml(inchado);
    expect(compacto).toContain('Nome');
    expect(compacto).toContain('Descrição');
    expect(compacto).not.toMatch(/Nome<br>/i);
    expect((compacto.match(/<br>/gi) ?? []).length).toBe(0);
  });

  it('adiciona e remove coluna no HTML', () => {
    const comColuna = adicionarColunaHtml(html);
    expect((comColuna.match(/<th>/g) ?? []).length).toBe(3);
    const semColuna = removerColunaHtml(comColuna, 0, 2);
    expect((semColuna.match(/<th>/g) ?? []).length).toBe(2);
  });
});
