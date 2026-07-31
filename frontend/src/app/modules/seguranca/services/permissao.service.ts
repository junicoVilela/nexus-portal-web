import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Permissao } from '../models/permissao.model';

export interface PermissaoFilter {
  q?: string;
  funcionalidadeId?: string;
  dominioCodigo?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

/** Resposta bruta do backend /api/v1/rbac/catalogo/permissoes. */
interface BackendPermissaoResponse {
  id: string;
  funcionalidadeId: string;
  funcionalidadeCodigo: string;
  dominioCodigo: string;
  acao: string;
  codigo: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Catálogo RBAC é read-only no backend. O service expõe paginação e filtros
 * client-side e mantém cache em memória para mapear códigos → IDs.
 */
@Injectable({ providedIn: 'root' })
export class PermissaoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/catalogo/permissoes`;
  private readonly cache = signal<Permissao[]>([]);
  private readonly mapaCodigoParaId = computed(() => new Map(this.cache().map(p => [p.codigo, p.id])));

  listar(filter: PermissaoFilter = {}): Observable<PageResult<Permissao>> {
    return this.listarTodos().pipe(map(todas => this.paginar(this.aplicarFiltros(todas, filter), filter)));
  }

  listarTodos(): Observable<Permissao[]> {
    const cached = this.cache();
    if (cached.length > 0) {
      return of(cached);
    }
    return this.http.get<BackendPermissaoResponse[]>(this.base).pipe(
      map(list => list.map(p => this.mapear(p))),
      tap(list => this.cache.set(list)),
    );
  }

  /** Traduz códigos RBAC para IDs usando o cache populado por listarTodos(). */
  idsPorCodigos(codigos: string[]): string[] {
    const mapa = this.mapaCodigoParaId();
    return codigos.map(c => mapa.get(c)).filter((id): id is string => !!id);
  }

  private aplicarFiltros(lista: Permissao[], filter: PermissaoFilter): Permissao[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(p =>
        p.codigo.toLowerCase().includes(q) || p.acao.toLowerCase().includes(q),
      );
    }
    if (filter.funcionalidadeId) out = out.filter(p => p.funcionalidadeId === filter.funcionalidadeId);
    if (filter.dominioCodigo) out = out.filter(p => p.dominioCodigo === filter.dominioCodigo);
    if (filter.ativo !== undefined) out = out.filter(p => p.ativo === filter.ativo);
    return out;
  }

  private paginar(lista: Permissao[], filter: PermissaoFilter): PageResult<Permissao> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 200;
    const start = (page - 1) * size;
    const items = lista.slice(start, start + size);
    return {
      items,
      page,
      size,
      totalItems: lista.length,
      totalPages: Math.max(1, Math.ceil(lista.length / size)),
      first: page === 1,
      last: start + size >= lista.length,
    };
  }

  private mapear(src: BackendPermissaoResponse): Permissao {
    return {
      id: src.id,
      funcionalidadeId: src.funcionalidadeId,
      funcionalidadeCodigo: src.funcionalidadeCodigo,
      dominioCodigo: src.dominioCodigo,
      acao: src.acao,
      codigo: src.codigo,
      descricao: src.descricao,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
    };
  }
}
