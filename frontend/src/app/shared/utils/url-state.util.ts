import { Params } from '@angular/router';

/**
 * Lê `params` da URL e retorna um objeto onde cada chave declarada em `schema`
 * é convertida pelo parser correspondente. Parâmetros ausentes recebem o
 * default declarado.
 *
 * `compactQueryParams` (em `query-state.ts`) faz o caminho inverso, omitindo
 * defaults e empty strings.
 */
export type ParamParser<T> = (raw: string | null) => T;

export interface UrlStateSchema<S extends Record<string, unknown>> {
  defaults: S;
  parsers: { [K in keyof S]: ParamParser<S[K]> };
}

export function readUrlState<S extends Record<string, unknown>>(
  params: Params,
  schema: UrlStateSchema<S>,
): S {
  const out = { ...schema.defaults } as S;
  for (const key in schema.parsers) {
    const raw = params[key];
    const value = typeof raw === 'string' || raw === null || raw === undefined ? (raw ?? null) : String(raw);
    out[key] = schema.parsers[key](value);
  }
  return out;
}

export const parseString =
  (fallback = ''): ParamParser<string> =>
  v =>
    v ?? fallback;

export const parseInt10 =
  (fallback: number, min = 1): ParamParser<number> =>
  v => {
    const n = Number(v);
    return Number.isInteger(n) && n >= min ? n : fallback;
  };

export const parseEnum =
  <T extends string>(allowed: readonly T[], fallback: T | ''): ParamParser<T | ''> =>
  v => {
    if (!v) return fallback;
    return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  };
