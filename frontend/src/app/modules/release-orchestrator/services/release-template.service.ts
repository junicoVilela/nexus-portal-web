import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { ReleaseTemplate, ReleaseTemplateForm } from '../models/release-template.model';

@Injectable({ providedIn: 'root' })
export class ReleaseTemplateService {
  private readonly base = `${environment.releaseOrchestratorApiUrl}/templates`;

  constructor(private readonly http: HttpClient) {}

  listar(page = 1, size = 20, nome?: string, ativo?: boolean): Observable<PageResult<ReleaseTemplate>> {
    const params = buildQueryParams({ page, size, nome, ativo });
    return this.http
      .get<PageResult<ReleaseTemplate>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  buscarPorId(id: string): Observable<ReleaseTemplate> {
    return this.http.get<ReleaseTemplate>(`${this.base}/${id}`);
  }

  criar(data: ReleaseTemplateForm): Observable<ReleaseTemplate> {
    return this.http.post<ReleaseTemplate>(this.base, data);
  }

  atualizar(id: string, data: ReleaseTemplateForm): Observable<ReleaseTemplate> {
    return this.http.put<ReleaseTemplate>(`${this.base}/${id}`, data);
  }

  alterarStatus(id: string, ativo: boolean): Observable<ReleaseTemplate> {
    return this.http.patch<ReleaseTemplate>(`${this.base}/${id}/status`, { ativo });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
