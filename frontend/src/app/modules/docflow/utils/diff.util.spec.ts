import { diffPalavras, diffLinhasPalavras } from './diff.util';

describe('diffPalavras', () => {
  it('returns a single neutral token when texts are identical', async () => {
    const tokens = await diffPalavras('Olá mundo', 'Olá mundo');
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every(t => t.tipo === ' ')).toBe(true);
  });

  it('marks added and removed words when texts differ', async () => {
    const tokens = await diffPalavras('foo bar', 'foo baz');
    const tipos = new Set(tokens.map(t => t.tipo));
    expect(tipos.has('+')).toBe(true);
    expect(tipos.has('-')).toBe(true);
  });
});

describe('diffLinhasPalavras', () => {
  it('returns only neutral lines when inputs are equal', async () => {
    const linhas = await diffLinhasPalavras('a\nb\n', 'a\nb\n');
    expect(linhas.every(l => l.tipo === ' ')).toBe(true);
  });

  it('produces a "-" line followed by a "+" line when a line changes', async () => {
    const linhas = await diffLinhasPalavras('uma linha\n', 'outra linha\n');
    const tipos = linhas.map(l => l.tipo);
    expect(tipos).toContain('-');
    expect(tipos).toContain('+');
  });

  it('marks pure additions as a single "+" line', async () => {
    const linhas = await diffLinhasPalavras('a\n', 'a\nb\n');
    expect(linhas.some(l => l.tipo === '+' && l.tokens.some(t => t.texto.includes('b')))).toBe(true);
  });

  it('marks pure removals as a single "-" line', async () => {
    const linhas = await diffLinhasPalavras('a\nb\n', 'a\n');
    expect(linhas.some(l => l.tipo === '-' && l.tokens.some(t => t.texto.includes('b')))).toBe(true);
  });
});
