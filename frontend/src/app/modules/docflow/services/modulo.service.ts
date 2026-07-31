import { Injectable, Injector } from '@angular/core';
import { defer, map, Observable, shareReplay, tap } from 'rxjs';
import { TIMINGS } from '@core/config/timings';
import { PageResult } from '@shared/models/page-result.model';
import { SortDirection } from '@shared/utils/query-state';
import {
  atualizar17 as atualizarModuloSdk,
  buscar15 as buscarModuloSdk,
  criar16 as criarModuloSdk,
  excluir12 as excluirModuloSdk,
  listar21 as listarModulosSdk,
} from '../../../api/generated/sdk.gen';
import type { ModuloRequest, ModuloResponse } from '../../../api/generated/types.gen';
import { Modulo } from '../models/modulo.model';

const CACHE_TTL_MS = TIMINGS.serviceCacheTtlMs;

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private cache = new Map<string, { obs: Observable<Modulo[]>; at: number }>();

  constructor(private readonly injector: Injector) {}

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
    return defer(() => listarModulosSdk({ query: params, injector: this.injector })).pipe(
      map(resposta =>
        this.mapearPageResult(resposta.data, params.size, item => this.mapearModulo(item)),
      ),
    );
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
    return defer(() => buscarModuloSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearModulo(resposta.data)),
    );
  }

  salvarModulo(payload: Partial<Modulo>, id?: string): Observable<Modulo> {
    const body = payload as ModuloRequest;
    const op = id
      ? defer(() => atualizarModuloSdk({ path: { id }, body, injector: this.injector })).pipe(
          map(resposta => this.mapearModulo(resposta.data)),
        )
      : defer(() => criarModuloSdk({ body, injector: this.injector })).pipe(
          map(resposta => this.mapearModulo(resposta.data)),
        );
    return op.pipe(tap(() => this.invalidarCache()));
  }

  excluirModulo(id: string): Observable<void> {
    return defer(() => excluirModuloSdk({ path: { id }, injector: this.injector })).pipe(
      map(() => undefined),
      tap(() => this.invalidarCache()),
    );
  }

  invalidarCache(): void {
    this.cache.clear();
  }

  private mapearModulo(item: ModuloResponse): Modulo {
    return item as Modulo;
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
