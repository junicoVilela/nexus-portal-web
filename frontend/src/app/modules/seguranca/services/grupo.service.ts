import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { GrupoAcesso, GrupoAcessoForm } from '../models/grupo-acesso.model';
import { MockStore } from './mock/mock-store.service';

export interface GrupoFilter {
  q?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
}

/** Resposta bruta do backend /api/v1/rbac/grupos. */
interface BackendGrupoResponse {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  permissoes: string[];
  totalUsuarios: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

@Injectable({ providedIn: 'root' })
export class GrupoService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(MockStore);
  private readonly base = `${environment.rbacApiUrl}/grupos`;

  listar(filter: GrupoFilter = {}): Observable<PageResult<GrupoAcesso>> {
    let params = new HttpParams()
      .set('page', String(filter.page ?? 1))
      .set('size', String(filter.size ?? 20));
    if (filter.q) params = params.set('nome', filter.q);
    return this.http.get<PageResult<BackendGrupoResponse>>(this.base, { params }).pipe(
      map(res => ({
        ...res,
        items: res.items
          .map(g => this.mapear(g))
          .filter(g => filter.ativo === undefined || g.ativo === filter.ativo),
      })),
    );
  }

  /**
   * Retorna todos os grupos ativos e inativos usando página grande — o
   * backend não expõe endpoint "listar tudo" e as telas assumem alguns
   * milhares no máximo.
   */
  listarTodos(): Observable<GrupoAcesso[]> {
    return this.listar({ page: 1, size: 500 }).pipe(map(res => res.items));
  }

  buscarPorId(id: string): Observable<GrupoAcesso> {
    return this.http.get<BackendGrupoResponse>(`${this.base}/${id}`).pipe(map(g => this.mapear(g)));
  }

  criar(form: GrupoAcessoForm): Observable<GrupoAcesso> {
    return this.http
      .post<BackendGrupoResponse>(this.base, {
        nome: form.nome,
        descricao: form.descricao ?? null,
        ativo: form.ativo,
      })
      .pipe(map(g => this.mapear(g)));
  }

  atualizar(id: string, form: GrupoAcessoForm): Observable<GrupoAcesso> {
    return this.http
      .put<BackendGrupoResponse>(`${this.base}/${id}`, {
        nome: form.nome,
        descricao: form.descricao ?? null,
        ativo: form.ativo,
      })
      .pipe(map(g => this.mapear(g)));
  }

  alterarStatus(id: string, ativo: boolean): Observable<GrupoAcesso> {
    return this.http
      .patch<BackendGrupoResponse>(`${this.base}/${id}/status`, { ativo })
      .pipe(map(g => this.mapear(g)));
  }

  /**
   * Recebe IDs de permissão (formato da UI), traduz para códigos via
   * MockStore.permissoes (enquanto PermissaoService for mock) e envia ao
   * backend. Ao migrar PermissaoService para HTTP real, o mapa
   * id → código passa a vir de lá.
   */
  vincularPermissoes(grupoId: string, permissaoIds: string[]): Observable<void> {
    const codigos = this.store
      .permissoes()
      .filter(p => permissaoIds.includes(p.id))
      .map(p => p.codigo);
    return this.http.put<void>(`${this.base}/${grupoId}/permissoes`, { permissoes: codigos });
  }

  listarMembros(grupoId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/${grupoId}/usuarios`);
  }

  salvarMembros(grupoId: string, usuarioIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/${grupoId}/usuarios`, { usuarioIds });
  }

  private mapear(src: BackendGrupoResponse): GrupoAcesso {
    return {
      id: src.id,
      nome: src.nome,
      codigo: src.codigo,
      descricao: src.descricao,
      ativo: src.ativo,
      criadoEm: src.createdAt,
      atualizadoEm: src.updatedAt,
      permissaoIds: this.store
        .permissoes()
        .filter(p => src.permissoes.includes(p.codigo))
        .map(p => p.id),
      totalUsuarios: src.totalUsuarios,
    };
  }
}
