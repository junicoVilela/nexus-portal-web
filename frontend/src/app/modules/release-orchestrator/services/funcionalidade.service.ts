import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import {
  ClienteFuncionalidade,
  DominioProduto,
  FuncionalidadeProduto,
  SalvarClienteFuncionalidadeForm,
} from '../models/funcionalidade.model';

@Injectable({ providedIn: 'root' })
export class FuncionalidadeService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.releaseOrchestratorApiUrl;

  listarDominios(produtoId: string): Observable<DominioProduto[]> {
    return this.http.get<DominioProduto[]>(`${this.base}/produtos/${produtoId}/dominios`);
  }

  listarFuncionalidades(
    produtoId: string,
    dominioId: string,
  ): Observable<FuncionalidadeProduto[]> {
    return this.http.get<FuncionalidadeProduto[]>(
      `${this.base}/produtos/${produtoId}/dominios/${dominioId}/funcionalidades`,
    );
  }

  listarClienteFuncionalidades(
    clienteId: string,
    produtoId?: string,
  ): Observable<ClienteFuncionalidade[]> {
    const qs = produtoId ? `?produtoId=${produtoId}` : '';
    return this.http.get<ClienteFuncionalidade[]>(
      `${this.base}/clientes/${clienteId}/funcionalidades${qs}`,
    );
  }

  salvar(
    clienteId: string,
    funcionalidadeId: string,
    form: SalvarClienteFuncionalidadeForm,
  ): Observable<ClienteFuncionalidade> {
    return this.http.put<ClienteFuncionalidade>(
      `${this.base}/clientes/${clienteId}/funcionalidades/${funcionalidadeId}`,
      form,
    );
  }

  remover(clienteId: string, funcionalidadeId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/clientes/${clienteId}/funcionalidades/${funcionalidadeId}`,
    );
  }
}
