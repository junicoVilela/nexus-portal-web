import { HttpParams } from '@angular/common/http';

export function buildQueryParams(
  values: Record<string, string | number | boolean | undefined | null>,
): HttpParams {
  let params = new HttpParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params = params.set(key, String(value));
  });
  return params;
}
