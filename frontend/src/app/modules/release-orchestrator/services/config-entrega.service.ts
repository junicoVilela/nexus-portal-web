import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { ConfigEntrega, ConfigEntregaForm } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ConfigEntregaService {
  private readonly http = inject(HttpClient);

  private url(clienteId: string): string {
    return `${environment.releaseOrchestratorApiUrl}/clientes/${clienteId}/config-entrega`;
  }

  buscar(clienteId: string): Observable<ConfigEntrega> {
    return this.http.get<ConfigEntrega>(this.url(clienteId));
  }

  /** Upsert (cria se não existir, atualiza se existir). */
  salvar(clienteId: string, form: ConfigEntregaForm): Observable<ConfigEntrega> {
    return this.http.put<ConfigEntrega>(this.url(clienteId), form);
  }
}
