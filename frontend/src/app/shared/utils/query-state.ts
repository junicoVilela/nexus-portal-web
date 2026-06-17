import { Params } from '@angular/router';

export type SortDirection = 'ASC' | 'DESC';

export function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseSortDirection(value: string | null, fallback: SortDirection = 'ASC'): SortDirection {
  return value === 'DESC' ? 'DESC' : value === 'ASC' ? 'ASC' : fallback;
}

export function compactQueryParams(
  params: Record<string, string | number | null | undefined>,
  defaults: Record<string, string | number> = {},
): Params {
  const compact: Params = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (key in defaults && String(defaults[key]) === String(value)) return;
    compact[key] = value;
  });
  return compact;
}
