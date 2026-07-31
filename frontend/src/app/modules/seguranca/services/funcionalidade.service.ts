import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Funcionalidade } from '../models/funcionalidade.model';

export interface FuncionalidadeFilter {
  q?: string;
  dominioId?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

interface BackendFuncionalidadeResponse {
  id: string;
  dominioId: string;
  dominioCodigo: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class FuncionalidadeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/catalogo/funcionalidades`;

  listar(filter: FuncionalidadeFilter = {}): Observable<PageResult<Funcionalidade>> {
    return this.listarTodos().pipe(map(all => this.paginar(this.aplicarFiltros(all, filter), filter)));
  }

  listarPorDominio(dominioId: string): Observable<Funcionalidade[]> {
    return this.listarTodos().pipe(map(all => all.filter(f => f.dominioId === dominioId)));
  }

  private listarTodos(): Observable<Funcionalidade[]> {
    return this.http.get<BackendFuncionalidadeResponse[]>(this.base).pipe(map(list => list.map(f => this.mapear(f))));
  }

  private aplicarFiltros(lista: Funcionalidade[], filter: FuncionalidadeFilter): Funcionalidade[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(f => f.nome.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q));
    }
    if (filter.dominioId) out = out.filter(f => f.dominioId === filter.dominioId);
    if (filter.ativo !== undefined) out = out.filter(f => f.ativo === filter.ativo);
    return out;
  }

  private paginar(lista: Funcionalidade[], filter: FuncionalidadeFilter): PageResult<Funcionalidade> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 100;
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

  private mapear(src: BackendFuncionalidadeResponse): Funcionalidade {
    return {
      id: src.id,
      dominioId: src.dominioId,
      dominioCodigo: src.dominioCodigo,
      nome: src.nome,
      codigo: src.codigo,
      descricao: src.descricao,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
    };
  }
}
