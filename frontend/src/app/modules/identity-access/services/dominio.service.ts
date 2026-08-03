import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { Dominio } from '../models/dominio.model';

export interface DominioFilter {
  q?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

interface BackendDominioResponse {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class DominioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/catalogo/dominios`;

  listar(filter: DominioFilter = {}): Observable<PageResult<Dominio>> {
    return this.listarTodos().pipe(map(all => this.paginar(this.aplicarFiltros(all, filter), filter)));
  }

  listarTodos(): Observable<Dominio[]> {
    return this.http.get<BackendDominioResponse[]>(this.base).pipe(map(list => list.map(d => this.mapear(d))));
  }

  private aplicarFiltros(lista: Dominio[], filter: DominioFilter): Dominio[] {
    let out = lista;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      out = out.filter(d => d.nome.toLowerCase().includes(q) || d.codigo.toLowerCase().includes(q));
    }
    if (filter.ativo !== undefined) out = out.filter(d => d.ativo === filter.ativo);
    return out;
  }

  private paginar(lista: Dominio[], filter: DominioFilter): PageResult<Dominio> {
    const page = filter.page ?? 1;
    const size = filter.size ?? 50;
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

  private mapear(src: BackendDominioResponse): Dominio {
    return {
      id: src.id,
      nome: src.nome,
      codigo: src.codigo,
      descricao: src.descricao,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
    };
  }
}
