import { buildQueryParams } from './http-params.util';

describe('buildQueryParams', () => {
  it('produces an empty HttpParams when no entries are set', () => {
    expect(buildQueryParams({}).keys().length).toBe(0);
  });

  it('serializes strings, numbers and booleans', () => {
    const p = buildQueryParams({ s: 'foo', n: 3, b: true });
    expect(p.get('s')).toBe('foo');
    expect(p.get('n')).toBe('3');
    expect(p.get('b')).toBe('true');
  });

  it('drops undefined, null and empty-string values', () => {
    const p = buildQueryParams({ keep: 'x', a: undefined, b: null, c: '' });
    expect(p.keys()).toEqual(['keep']);
  });

  it('keeps boolean false', () => {
    const p = buildQueryParams({ ativo: false });
    expect(p.get('ativo')).toBe('false');
  });
});
