import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import {
  AtualizarModuloProdutoForm,
  CriarModuloProdutoForm,
  ModuloProduto,
} from '../models/modulo-produto.model';

/**
 * CRUD do catálogo de módulos de um produto.
 * Endpoints: `/api/v1/release-orchestrator/produtos/{produtoId}/modulos/...`
 */
@Injectable({ providedIn: 'root' })
export class ModuloProdutoService {
  private readonly http = inject(HttpClient);

  private base(produtoId: string): string {
    return `${environment.releaseOrchestratorApiUrl}/produtos/${produtoId}/modulos`;
  }

  listar(produtoId: string): Observable<ModuloProduto[]> {
    return this.http.get<ModuloProduto[]>(this.base(produtoId));
  }

  buscar(produtoId: string, id: string): Observable<ModuloProduto> {
    return this.http.get<ModuloProduto>(`${this.base(produtoId)}/${id}`);
  }

  criar(produtoId: string, form: CriarModuloProdutoForm): Observable<ModuloProduto> {
    return this.http.post<ModuloProduto>(this.base(produtoId), form);
  }

  atualizar(produtoId: string, id: string, form: AtualizarModuloProdutoForm): Observable<ModuloProduto> {
    return this.http.put<ModuloProduto>(`${this.base(produtoId)}/${id}`, form);
  }

  alterarStatus(produtoId: string, id: string, ativo: boolean): Observable<ModuloProduto> {
    return this.http.patch<ModuloProduto>(`${this.base(produtoId)}/${id}/status`, { ativo });
  }

  excluir(produtoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(produtoId)}/${id}`);
  }
}
