import { parseEnum, parseInt10, parseString, readUrlState } from './url-state.util';

describe('url-state.util', () => {
  describe('parseString', () => {
    it('retorna o valor quando presente', () => {
      expect(parseString()('foo')).toBe('foo');
    });
    it('retorna fallback quando null', () => {
      expect(parseString('def')(null)).toBe('def');
    });
  });

  describe('parseInt10', () => {
    it('retorna inteiros >= min', () => {
      expect(parseInt10(0, 1)('3')).toBe(3);
    });
    it('retorna fallback para abaixo do mínimo', () => {
      expect(parseInt10(7, 1)('0')).toBe(7);
    });
    it('retorna fallback para não-inteiros', () => {
      expect(parseInt10(7)('abc')).toBe(7);
      expect(parseInt10(7)('1.5')).toBe(7);
    });
  });

  describe('parseEnum', () => {
    const allowed = ['A', 'B', 'C'] as const;
    it('aceita valor da lista', () => {
      expect(parseEnum(allowed, '')('B')).toBe('B');
    });
    it('rejeita valor fora da lista', () => {
      expect(parseEnum(allowed, '')('X')).toBe('');
    });
    it('retorna fallback para vazio', () => {
      expect(parseEnum(allowed, 'A' as const)(null)).toBe('A');
    });
  });

  describe('readUrlState', () => {
    const schema = {
      defaults: { q: '', page: 1, status: '' as 'ATIVO' | 'INATIVO' | '' },
      parsers: {
        q: parseString(),
        page: parseInt10(1),
        status: parseEnum(['ATIVO', 'INATIVO'] as const, ''),
      },
    };

    it('aplica defaults quando params está vazio', () => {
      expect(readUrlState({}, schema)).toEqual({ q: '', page: 1, status: '' });
    });

    it('mescla valores presentes', () => {
      expect(readUrlState({ q: 'foo', page: '5' }, schema)).toEqual({
        q: 'foo',
        page: 5,
        status: '',
      });
    });

    it('descarta valores inválidos e usa fallback', () => {
      expect(readUrlState({ page: 'abc', status: 'OUTRO' }, schema)).toEqual({
        q: '',
        page: 1,
        status: '',
      });
    });
  });
});
