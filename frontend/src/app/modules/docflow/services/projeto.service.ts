import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import { TIMINGS } from '@core/config/timings';
import { Projeto } from '../models/projeto.model';

const CACHE_TTL_MS = TIMINGS.serviceCacheTtlMs;

@Injectable({ providedIn: 'root' })
export class ProjetoService {
  private readonly base = environment.apiUrl;
  private projetosCache$?: Observable<Projeto[]>;
  private projetosCacheAt = 0;

  constructor(private readonly http: HttpClient) {}

  listarProjetos(
    params: { nome?: string; sort?: string; dir?: SortDirection; page?: number; size?: number } = {},
  ): Observable<PageResult<Projeto>> {
    return this.http.get<PageResult<Projeto>>(`${this.base}/projetos`, {
      params: buildQueryParams(params),
    });
  }

  projetos(): Observable<Projeto[]> {
    if (!this.projetosCache$ || Date.now() - this.projetosCacheAt > CACHE_TTL_MS) {
      this.projetosCacheAt = Date.now();
      this.projetosCache$ = this.listarProjetos({ page: 1, size: 1000 }).pipe(
        map(r => r.items),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.projetosCache$;
  }

  projeto(id: string): Observable<Projeto> {
    return this.http.get<Projeto>(`${this.base}/projetos/${id}`);
  }

  salvarProjeto(payload: Partial<Projeto>, id?: string): Observable<Projeto> {
    const op = id
      ? this.http.put<Projeto>(`${this.base}/projetos/${id}`, payload)
      : this.http.post<Projeto>(`${this.base}/projetos`, payload);
    return op.pipe(tap(() => this.invalidarCache()));
  }

  invalidarCache(): void {
    this.projetosCache$ = undefined;
    this.projetosCacheAt = 0;
  }
}
