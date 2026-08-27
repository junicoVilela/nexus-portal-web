import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { Host, HostForm, SistemaOperacionalHost } from '../models/host.model';

@Injectable({ providedIn: 'root' })
export class HostService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.releaseOrchestratorApiUrl}/hosts`;

  listar(
    page = 1,
    size = 20,
    q?: string,
    ativo?: boolean,
    sistemaOperacional?: SistemaOperacionalHost,
    dockerDisponivel?: boolean,
  ): Observable<PageResult<Host>> {
    const params = buildQueryParams({ page, size, q, ativo, sistemaOperacional, dockerDisponivel });
    return this.http
      .get<PageResult<Host>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  buscar(id: string): Observable<Host> {
    return this.http.get<Host>(`${this.base}/${id}`);
  }

  criar(form: HostForm): Observable<Host> {
    return this.http.post<Host>(this.base, form);
  }

  atualizar(id: string, form: HostForm): Observable<Host> {
    return this.http.put<Host>(`${this.base}/${id}`, form);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Host> {
    return this.http.patch<Host>(`${this.base}/${id}/status`, { ativo });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
