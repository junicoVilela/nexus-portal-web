import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import { TIMINGS } from '@core/config/timings';
import { Modulo } from '../models/modulo.model';

const CACHE_TTL_MS = TIMINGS.serviceCacheTtlMs;

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private readonly base = environment.apiUrl;
  private cache = new Map<string, { obs: Observable<Modulo[]>; at: number }>();

  constructor(private readonly http: HttpClient) {}

  listarModulos(
    params: {
      projetoId?: string;
      nome?: string;
      sort?: string;
      dir?: SortDirection;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PageResult<Modulo>> {
    return this.http.get<PageResult<Modulo>>(`${this.base}/modulos`, {
      params: buildQueryParams(params),
    });
  }

  modulos(projetoId?: string): Observable<Modulo[]> {
    const key = projetoId ?? '__all__';
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at <= CACHE_TTL_MS) return cached.obs;
    const obs = this.listarModulos({ projetoId, page: 1, size: 1000 }).pipe(
      map(r => r.items),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(key, { obs, at: Date.now() });
    return obs;
  }

  modulo(id: string): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.base}/modulos/${id}`);
  }

  salvarModulo(payload: Partial<Modulo>, id?: string): Observable<Modulo> {
    const op = id
      ? this.http.put<Modulo>(`${this.base}/modulos/${id}`, payload)
      : this.http.post<Modulo>(`${this.base}/modulos`, payload);
    return op.pipe(tap(() => this.invalidarCache()));
  }

  excluirModulo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/modulos/${id}`).pipe(tap(() => this.invalidarCache()));
  }

  invalidarCache(): void {
    this.cache.clear();
  }
}
