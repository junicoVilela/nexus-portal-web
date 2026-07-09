import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import {
  AcessoTemporario,
  AcessoTemporarioForm,
  AcessoTemporarioStatus,
} from '../models/acesso-temporario.model';

export interface AcessoTemporarioFilter {
  usuarioId?: string;
  status?: AcessoTemporarioStatus;
  page?: number;
  size?: number;
}

interface BackendAcessoTemporarioResponse {
  id: string;
  usuarioId: string;
  grupoAcessoId: string | null;
  permissaoId: string | null;
  escopoAcessoId: string | null;
  inicioEm: string;
  fimEm: string;
  status: AcessoTemporarioStatus;
  justificativa: string | null;
  criadoEm: string;
  revogadoEm: string | null;
}

@Injectable({ providedIn: 'root' })
export class AcessoTemporarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/acessos-temporarios`;

  /**
   * No-op: expiração agora é status derivado no backend (não persiste).
   * Mantido pra manter compat com telas que ainda chamam antes de listar.
   */
  expirarVencidos(): void {}

  listar(filter: AcessoTemporarioFilter = {}): Observable<PageResult<AcessoTemporario>> {
    let params = new HttpParams()
      .set('page', String(filter.page ?? 1))
      .set('size', String(filter.size ?? 20));
    if (filter.usuarioId) params = params.set('usuarioId', filter.usuarioId);
    return this.http.get<PageResult<BackendAcessoTemporarioResponse>>(this.base, { params }).pipe(
      map(res => ({
        ...res,
        items: res.items
          .map(a => this.mapear(a))
          .filter(a => !filter.status || a.status === filter.status),
      })),
    );
  }

  criar(form: AcessoTemporarioForm): Observable<AcessoTemporario> {
    return this.http
      .post<BackendAcessoTemporarioResponse>(this.base, {
        usuarioId: form.usuarioId,
        grupoAcessoId: form.grupoAcessoId ?? null,
        permissaoId: form.permissaoId ?? null,
        escopoAcessoId: form.escopoAcessoId ?? null,
        inicioEm: form.inicioEm,
        fimEm: form.fimEm,
        justificativa: form.justificativa ?? null,
      })
      .pipe(map(a => this.mapear(a)));
  }

  revogar(id: string, motivo = 'Revogado manualmente'): Observable<AcessoTemporario> {
    const params = new HttpParams().set('motivo', motivo);
    return this.http
      .post<BackendAcessoTemporarioResponse>(`${this.base}/${id}/revogar`, null, { params })
      .pipe(map(a => this.mapear(a)));
  }

  private mapear(src: BackendAcessoTemporarioResponse): AcessoTemporario {
    return {
      id: src.id,
      usuarioId: src.usuarioId,
      grupoAcessoId: src.grupoAcessoId,
      permissaoId: src.permissaoId,
      escopoAcessoId: src.escopoAcessoId,
      inicioEm: src.inicioEm,
      fimEm: src.fimEm,
      status: src.status,
      justificativa: src.justificativa,
      criadoEm: src.criadoEm,
      revogadoEm: src.revogadoEm,
    };
  }
}
