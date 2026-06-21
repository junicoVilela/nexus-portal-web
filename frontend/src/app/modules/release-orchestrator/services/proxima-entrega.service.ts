import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import {
  ProximaEntrega,
  ProximaEntregaForm,
  StatusProximaEntrega,
} from '../models/proxima-entrega.model';

export interface ProximaEntregaFiltros {
  clienteId?: string;
  produtoId?: string;
  status?: StatusProximaEntrega;
  dataDe?: string;
  dataAte?: string;
}

@Injectable({ providedIn: 'root' })
export class ProximaEntregaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.releaseOrchestratorApiUrl}/proximas-entregas`;

  listar(page = 1, size = 20, filtros: ProximaEntregaFiltros = {})
    : Observable<PageResult<ProximaEntrega>> {
    const params = buildQueryParams({ page, size, ...filtros });
    return this.http
      .get<PageResult<ProximaEntrega>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  buscar(id: string): Observable<ProximaEntrega> {
    return this.http.get<ProximaEntrega>(`${this.base}/${id}`);
  }

  criar(form: ProximaEntregaForm): Observable<ProximaEntrega> {
    return this.http.post<ProximaEntrega>(this.base, form);
  }

  atualizar(id: string, form: ProximaEntregaForm): Observable<ProximaEntrega> {
    return this.http.put<ProximaEntrega>(`${this.base}/${id}`, form);
  }

  alterarStatus(id: string, status: StatusProximaEntrega): Observable<ProximaEntrega> {
    return this.http.patch<ProximaEntrega>(`${this.base}/${id}/status`, { status });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
