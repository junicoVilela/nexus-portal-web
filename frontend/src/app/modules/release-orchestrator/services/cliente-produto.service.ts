import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import {
  AtualizarClienteProdutoForm,
  ClienteProduto,
  ClienteProdutoModulo,
  ContratarProdutoForm,
  SalvarClienteProdutoModuloForm,
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

  listarModulos(clienteId: string, clienteProdutoId: string): Observable<ClienteProdutoModulo[]> {
    return this.http.get<ClienteProdutoModulo[]>(
      `${this.base(clienteId)}/${clienteProdutoId}/modulos`,
    );
  }

  salvarModulo(
    clienteId: string,
    clienteProdutoId: string,
    moduloProdutoId: string,
    form: SalvarClienteProdutoModuloForm,
  ): Observable<ClienteProdutoModulo> {
    return this.http.put<ClienteProdutoModulo>(
      `${this.base(clienteId)}/${clienteProdutoId}/modulos/${moduloProdutoId}`,
      form,
    );
  }

  removerModulo(
    clienteId: string,
    clienteProdutoId: string,
    moduloProdutoId: string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.base(clienteId)}/${clienteProdutoId}/modulos/${moduloProdutoId}`,
    );
  }
}
