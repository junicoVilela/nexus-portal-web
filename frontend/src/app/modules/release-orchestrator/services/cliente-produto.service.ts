import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import {
  AtualizarClienteProdutoForm,
  ClienteProduto,
  ContratarProdutoForm,
} from '../models/cliente-produto.model';

@Injectable({ providedIn: 'root' })
export class ClienteProdutoService {
  private readonly http = inject(HttpClient);

  private base(clienteId: string): string {
    return `${environment.releaseOrchestratorApiUrl}/clientes/${clienteId}/produtos`;
  }

  listar(clienteId: string): Observable<ClienteProduto[]> {
    return this.http.get<ClienteProduto[]>(this.base(clienteId));
  }

  contratar(clienteId: string, form: ContratarProdutoForm): Observable<ClienteProduto> {
    return this.http.post<ClienteProduto>(this.base(clienteId), form);
  }

  atualizar(
    clienteId: string,
    id: string,
    form: AtualizarClienteProdutoForm,
  ): Observable<ClienteProduto> {
    return this.http.put<ClienteProduto>(`${this.base(clienteId)}/${id}`, form);
  }

  rescindir(clienteId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(clienteId)}/${id}`);
  }
}
