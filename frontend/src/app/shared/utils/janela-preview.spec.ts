import { abrirJanelaPreview, escapeHtml } from './janela-preview';

describe('janela-preview', () => {
  function janelaFalsa() {
    const escritas: string[] = [];
    const documento = {
      open: jasmine.createSpy('open'),
      close: jasmine.createSpy('close'),
      write: (html: string) => escritas.push(html),
    };
    return { janela: { document: documento } as unknown as Window, escritas };
  }

  it('abre com a mensagem de carregando e depois exibe o HTML final', () => {
    const { janela, escritas } = janelaFalsa();
    const preview = abrirJanelaPreview('Preparando…', { open: () => janela });

    expect(escritas[0]).toContain('Preparando…');
    preview!.exibir('<html><body>Página</body></html>');
    expect(escritas[1]).toBe('<html><body>Página</body></html>');
  });

  it('mostra o erro escapado na própria janela', () => {
    const { janela, escritas } = janelaFalsa();
    abrirJanelaPreview(undefined, { open: () => janela })!.erro('<script>falha</script>');
    expect(escritas[1]).toContain('&lt;script&gt;falha&lt;/script&gt;');
    expect(escritas[1]).not.toContain('<script>');
  });

  it('popup bloqueado devolve null', () => {
    expect(abrirJanelaPreview(undefined, { open: () => null })).toBeNull();
  });

  it('escapa os caracteres especiais de HTML', () => {
    expect(escapeHtml(`a & b < c > "d" 'e'`)).toBe('a &amp; b &lt; c &gt; &quot;d&quot; &#39;e&#39;');
  });
});
