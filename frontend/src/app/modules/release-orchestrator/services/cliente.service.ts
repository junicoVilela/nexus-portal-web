import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { Cliente, ClienteForm } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.releaseOrchestratorApiUrl}/clientes`;

  listar(page = 1, size = 20, q?: string, ativo?: boolean): Observable<PageResult<Cliente>> {
    const params = buildQueryParams({ page, size, q, ativo });
    return this.http
      .get<PageResult<Cliente>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  buscar(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  criar(form: ClienteForm): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, form);
  }

  atualizar(id: string, form: ClienteForm): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, form);
  }

  alterarStatus(id: string, ativo: boolean): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.base}/${id}/status`, { ativo });
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
