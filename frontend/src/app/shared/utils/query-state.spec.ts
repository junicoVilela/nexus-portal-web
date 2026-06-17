import { compactQueryParams, parsePositiveInt, parseSortDirection } from './query-state';

describe('parsePositiveInt', () => {
  it('returns the parsed number when valid', () => {
    expect(parsePositiveInt('3', 1)).toBe(3);
  });

  it('returns fallback for non-numeric, zero, or negative inputs', () => {
    expect(parsePositiveInt(null, 7)).toBe(7);
    expect(parsePositiveInt('abc', 7)).toBe(7);
    expect(parsePositiveInt('0', 7)).toBe(7);
    expect(parsePositiveInt('-3', 7)).toBe(7);
    expect(parsePositiveInt('1.5', 7)).toBe(7);
  });
});

describe('parseSortDirection', () => {
  it('returns ASC/DESC when input matches exactly', () => {
    expect(parseSortDirection('ASC')).toBe('ASC');
    expect(parseSortDirection('DESC')).toBe('DESC');
  });

  it('returns fallback (default ASC) when input is invalid', () => {
    expect(parseSortDirection(null)).toBe('ASC');
    expect(parseSortDirection('asc')).toBe('ASC');
    expect(parseSortDirection('foo', 'DESC')).toBe('DESC');
  });
});

describe('compactQueryParams', () => {
  it('drops undefined, null and empty-string values', () => {
    expect(compactQueryParams({ a: 1, b: '', c: null, d: undefined, e: 'ok' })).toEqual({ a: 1, e: 'ok' });
  });

  it('omits values that equal the configured defaults', () => {
    expect(compactQueryParams({ page: 1, size: 20, q: 'foo' }, { page: 1, size: 20 })).toEqual({ q: 'foo' });
  });

  it('keeps values that differ from defaults', () => {
    expect(compactQueryParams({ page: 2, size: 20 }, { page: 1, size: 20 })).toEqual({ page: 2 });
  });
});
