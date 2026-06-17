import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay, tap } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { TIMINGS } from '@core/config/timings';
import { Produto, ProdutoForm } from '../models/produto.model';

const CACHE_TTL_MS = TIMINGS.serviceCacheTtlMs;

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly base = `${environment.releaseOrchestratorApiUrl}/produtos`;
  private todosCache$?: Observable<Produto[]>;
  private todosCacheAt = 0;

  constructor(private readonly http: HttpClient) {}

  listar(page = 1, size = 20, nome?: string, ativo?: boolean): Observable<PageResult<Produto>> {
    const params = buildQueryParams({ page, size, nome, ativo });
    return this.http
      .get<PageResult<Produto>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  listarTodos(): Observable<Produto[]> {
    if (!this.todosCache$ || Date.now() - this.todosCacheAt > CACHE_TTL_MS) {
      this.todosCacheAt = Date.now();
      const params = buildQueryParams({ page: 1, size: 200, ativo: true });
      this.todosCache$ = this.http.get<PageResult<Produto>>(this.base, { params }).pipe(
        map(r => r.items ?? []),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.todosCache$;
  }

  buscarPorId(id: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.base}/${id}`);
  }

  criar(data: ProdutoForm): Observable<Produto> {
    return this.http.post<Produto>(this.base, data).pipe(tap(() => this.invalidarCache()));
  }

  atualizar(id: string, data: ProdutoForm): Observable<Produto> {
    return this.http.put<Produto>(`${this.base}/${id}`, data).pipe(tap(() => this.invalidarCache()));
  }

  alterarStatus(id: string, ativo: boolean): Observable<Produto> {
    return this.http
      .patch<Produto>(`${this.base}/${id}/status`, { ativo })
      .pipe(tap(() => this.invalidarCache()));
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(tap(() => this.invalidarCache()));
  }

  uploadLogo(id: string, file: File): Observable<{ logoUrl: string }> {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http.post<{ logoUrl: string }>(`${this.base}/${id}/logo`, fd);
  }

  invalidarCache(): void {
    this.todosCache$ = undefined;
    this.todosCacheAt = 0;
  }
}
