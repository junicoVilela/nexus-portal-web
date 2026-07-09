import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { HistoricoLogin } from '../models/historico-login.model';

export interface HistoricoLoginFilter {
  usuarioId?: string;
  /** Busca textual no login informado. */
  q?: string;
  /** true = só sucessos, false = só falhas, undefined = todos. */
  sucesso?: boolean;
  /** ISO date (yyyy-mm-dd) inclusive. */
  inicio?: string;
  /** ISO date (yyyy-mm-dd) inclusive. */
  fim?: string;
  page?: number;
  size?: number;
}

interface BackendHistoricoLoginResponse {
  id: string;
  usuarioId: string | null;
  loginInformado: string;
  ipOrigem: string | null;
  userAgent: string | null;
  sucesso: boolean;
  motivoFalha: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class HistoricoLoginService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/historico-login`;

  listar(filter: HistoricoLoginFilter = {}): Observable<PageResult<HistoricoLogin>> {
    let params = new HttpParams()
      .set('page', String(filter.page ?? 1))
      .set('size', String(filter.size ?? 20));
    if (filter.usuarioId) params = params.set('usuarioId', filter.usuarioId);
    if (filter.q) params = params.set('login', filter.q);
    if (filter.sucesso !== undefined) params = params.set('sucesso', String(filter.sucesso));
    if (filter.inicio) params = params.set('inicio', filter.inicio + 'T00:00:00Z');
    if (filter.fim) params = params.set('fim', filter.fim + 'T23:59:59Z');
    return this.http
      .get<PageResult<BackendHistoricoLoginResponse>>(this.base, { params })
      .pipe(map(res => ({ ...res, items: res.items.map(h => this.mapear(h)) })));
  }

  private mapear(src: BackendHistoricoLoginResponse): HistoricoLogin {
    return {
      id: src.id,
      usuarioId: src.usuarioId,
      loginInformado: src.loginInformado,
      ipOrigem: src.ipOrigem,
      userAgent: src.userAgent,
      sucesso: src.sucesso,
      motivoFalha: src.motivoFalha,
      criadoEm: src.createdAt,
    };
  }
}
