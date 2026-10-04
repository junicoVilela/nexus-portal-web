import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { ManualAcesso, ManualAcessoCriado, ManualAcessoPayload } from '../models/manual-acesso.model';

/** Chaves de integração do manual (Onda D): sistemas do cliente abrem a ajuda e perguntam ao manual. */
@Injectable({ providedIn: 'root' })
export class ManualAcessoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listar(clienteId: string): Observable<ManualAcesso[]> {
    return this.http.get<ManualAcesso[]>(`${this.base}/clientes/${clienteId}/acessos-manual`);
  }

  criar(clienteId: string, payload: ManualAcessoPayload): Observable<ManualAcessoCriado> {
    return this.http.post<ManualAcessoCriado>(`${this.base}/clientes/${clienteId}/acessos-manual`, payload);
  }

  revogar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/acessos-manual/${id}`);
  }

  /** Base pública da API do manual (`/api/v1` atrás do mesmo host do portal). */
  apiPublica(): string {
    return `${window.location.origin}/api/v1`;
  }
}
