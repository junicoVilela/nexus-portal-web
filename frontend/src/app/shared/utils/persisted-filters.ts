import { TIMINGS } from '@core/config/timings';
const STORAGE_PREFIX = 'filtros:';
const TTL_MS = TIMINGS.filtersTtlDays * 86_400_000;

interface PersistedEnvelope<T> {
  value: T;
  at: number;
}

export function carregarFiltros<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as PersistedEnvelope<T>;
    if (!env || typeof env !== 'object') return null;
    if (Date.now() - env.at > TTL_MS) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return env.value;
  } catch {
    return null;
  }
}

export function salvarFiltros<T>(key: string, value: T): void {
  try {
    const env: PersistedEnvelope<T> = { value, at: Date.now() };
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(env));
  } catch {
    /* storage full / disabled */
  }
}

export function limparFiltrosPersistidos(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* noop */
  }
}
