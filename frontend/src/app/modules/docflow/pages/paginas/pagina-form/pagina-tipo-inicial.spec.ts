import { estruturaTipoPagina } from './pagina-tipo-inicial';

describe('estruturaTipoPagina', () => {
  it('devolve a estrutura do tipo conhecido', () => {
    expect(estruturaTipoPagina('menu')?.kitId).toBe('kit-menu');
  });

  it('ignora tipos desconhecidos (inclusive chaves do protótipo)', () => {
    expect(estruturaTipoPagina(null)).toBeNull();
    expect(estruturaTipoPagina('outro')).toBeNull();
    expect(estruturaTipoPagina('toString')).toBeNull();
  });
});
