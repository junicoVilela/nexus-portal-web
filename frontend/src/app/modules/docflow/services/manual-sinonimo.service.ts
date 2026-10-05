import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { ManualSinonimo, ManualSinonimoPayload } from '../models/manual-sinonimo.model';

/** Sinônimos da busca do manual por cliente: valem na hora para perguntas, MCP e manual hospedado. */
@Injectable({ providedIn: 'root' })
export class ManualSinonimoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listar(clienteId: string): Observable<ManualSinonimo[]> {
    return this.http.get<ManualSinonimo[]>(`${this.base}/clientes/${clienteId}/sinonimos-manual`);
  }

  criar(clienteId: string, payload: ManualSinonimoPayload): Observable<ManualSinonimo> {
    return this.http.post<ManualSinonimo>(`${this.base}/clientes/${clienteId}/sinonimos-manual`, payload);
  }

  atualizar(id: string, payload: ManualSinonimoPayload): Observable<ManualSinonimo> {
    return this.http.put<ManualSinonimo>(`${this.base}/sinonimos-manual/${id}`, payload);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sinonimos-manual/${id}`);
  }
}
