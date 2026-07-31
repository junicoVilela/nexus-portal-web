import { Injectable, Injector } from '@angular/core';
import { defer, map, Observable, shareReplay, tap } from 'rxjs';
import { TIMINGS } from '@core/config/timings';
import { PageResult } from '@shared/models/page-result.model';
import { SortDirection } from '@shared/utils/query-state';
import {
  atualizar15 as atualizarProjetoSdk,
  buscar13 as buscarProjetoSdk,
  criar14 as criarProjetoSdk,
  excluir10 as excluirProjetoSdk,
  listar19 as listarProjetosSdk,
} from '../../../api/generated/sdk.gen';
import type { ProjetoRequest, ProjetoResponse } from '../../../api/generated/types.gen';
import { Projeto } from '../models/projeto.model';

const CACHE_TTL_MS = TIMINGS.serviceCacheTtlMs;

@Injectable({ providedIn: 'root' })
export class ProjetoService {
  private projetosCache$?: Observable<Projeto[]>;
  private projetosCacheAt = 0;

  constructor(private readonly injector: Injector) {}

  listarProjetos(
    params: { nome?: string; sort?: string; dir?: SortDirection; page?: number; size?: number } = {},
  ): Observable<PageResult<Projeto>> {
    return defer(() => listarProjetosSdk({ query: params, injector: this.injector })).pipe(
      map(resposta =>
        this.mapearPageResult(resposta.data, params.size, item => this.mapearProjeto(item)),
      ),
    );
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
    return defer(() => buscarProjetoSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearProjeto(resposta.data)),
    );
  }

  salvarProjeto(payload: Partial<Projeto>, id?: string): Observable<Projeto> {
    const body = payload as ProjetoRequest;
    const op = id
      ? defer(() => atualizarProjetoSdk({ path: { id }, body, injector: this.injector })).pipe(
          map(resposta => this.mapearProjeto(resposta.data)),
        )
      : defer(() => criarProjetoSdk({ body, injector: this.injector })).pipe(
          map(resposta => this.mapearProjeto(resposta.data)),
        );
    return op.pipe(tap(() => this.invalidarCache()));
  }

  excluirProjeto(id: string): Observable<void> {
    return defer(() => excluirProjetoSdk({ path: { id }, injector: this.injector })).pipe(
      map(() => undefined),
      tap(() => this.invalidarCache()),
    );
  }

  invalidarCache(): void {
    this.projetosCache$ = undefined;
    this.projetosCacheAt = 0;
  }

  private mapearProjeto(item: ProjetoResponse): Projeto {
    return item as Projeto;
  }

  private mapearPageResult<TSource, TTarget>(
    data: {
      items?: TSource[];
      totalItems?: number;
      totalPages?: number;
      page?: number;
      size?: number;
      first?: boolean;
      last?: boolean;
    },
    defaultSize = 10,
    mapItem: (item: TSource) => TTarget = item => item as unknown as TTarget,
  ): PageResult<TTarget> {
    return {
      items: (data.items ?? []).map(mapItem),
      totalItems: data.totalItems ?? 0,
      totalPages: data.totalPages ?? 0,
      page: data.page ?? 1,
      size: data.size ?? defaultSize,
      first: data.first ?? true,
      last: data.last ?? true,
    };
  }
}
