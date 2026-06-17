import { TIMINGS } from '@core/config/timings';
import { carregarFiltros, salvarFiltros, limparFiltrosPersistidos } from './persisted-filters';

const KEY = 'unit-test';
const STORAGE_KEY = 'filtros:' + KEY;

describe('persisted-filters', () => {
  beforeEach(() => localStorage.clear());
  afterAll(() => localStorage.clear());

  it('returns null when no value is stored', () => {
    expect(carregarFiltros(KEY)).toBeNull();
  });

  it('round-trips a value through localStorage', () => {
    salvarFiltros(KEY, { q: 'foo', page: 2 });
    expect(carregarFiltros<{ q: string; page: number }>(KEY)).toEqual({ q: 'foo', page: 2 });
  });

  it('returns null and clears the entry when TTL has expired', () => {
    salvarFiltros(KEY, { q: 'old' });
    const ttlMs = TIMINGS.filtersTtlDays * 86_400_000;
    const envelope = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    envelope.at = Date.now() - ttlMs - 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));

    expect(carregarFiltros(KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid');
    expect(carregarFiltros(KEY)).toBeNull();
  });

  it('limparFiltrosPersistidos removes the entry', () => {
    salvarFiltros(KEY, { x: 1 });
    limparFiltrosPersistidos(KEY);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('salvarFiltros silently swallows storage failures', () => {
    const setItem = spyOn(Storage.prototype, 'setItem').and.throwError('quota exceeded');
    expect(() => salvarFiltros(KEY, { x: 1 })).not.toThrow();
    setItem.and.callThrough();
  });
});
