import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { SessaoUsuario } from '../models/sessao.model';

export interface SessaoFilter {
  usuarioId?: string;
  ativa?: boolean;
  page?: number;
  size?: number;
}

interface BackendSessaoResponse {
  id: string;
  usuarioId: string;
  ipOrigem: string | null;
  userAgent: string | null;
  ativa: boolean;
  revogada: boolean;
  motivoEncerramento: string | null;
  iniciadaEm: string;
  encerradaEm: string | null;
  expiraEm: string | null;
}

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/sessoes`;

  listar(filter: SessaoFilter = {}): Observable<PageResult<SessaoUsuario>> {
    let params = new HttpParams()
      .set('page', String(filter.page ?? 1))
      .set('size', String(filter.size ?? 20));
    if (filter.usuarioId) params = params.set('usuarioId', filter.usuarioId);
    if (filter.ativa !== undefined) params = params.set('ativa', String(filter.ativa));
    return this.http
      .get<PageResult<BackendSessaoResponse>>(this.base, { params })
      .pipe(map(res => ({ ...res, items: res.items.map(s => this.mapear(s)) })));
  }

  revogar(sessaoId: string, motivo = 'Revogada manualmente'): Observable<SessaoUsuario> {
    const params = new HttpParams().set('motivo', motivo);
    return this.http
      .post<BackendSessaoResponse>(`${this.base}/${sessaoId}/revogar`, null, { params })
      .pipe(map(s => this.mapear(s)));
  }

  private mapear(src: BackendSessaoResponse): SessaoUsuario {
    return {
      id: src.id,
      usuarioId: src.usuarioId,
      ipOrigem: src.ipOrigem,
      userAgent: src.userAgent,
      ativa: src.ativa,
      revogada: src.revogada,
      iniciadaEm: src.iniciadaEm,
      encerradaEm: src.encerradaEm,
      motivoEncerramento: src.motivoEncerramento,
    };
  }
}
