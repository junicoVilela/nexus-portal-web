import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import {
  AtualizarEntregaRascunhoForm,
  CriarEntregaForm,
  Entrega,
  StatusEntrega,
} from '../models/entrega.model';

export interface EntregaFiltros {
  clienteId?: string;
  produtoId?: string;
  status?: StatusEntrega;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class EntregaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.releaseOrchestratorApiUrl}/entregas`;

  listar(page = 1, size = 20, filtros: EntregaFiltros = {}): Observable<PageResult<Entrega>> {
    const params = buildQueryParams({ page, size, ...filtros });
    return this.http
      .get<PageResult<Entrega>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  buscar(id: string): Observable<Entrega> {
    return this.http.get<Entrega>(`${this.base}/${id}`);
  }

  criar(form: CriarEntregaForm): Observable<Entrega> {
    return this.http.post<Entrega>(this.base, form);
  }

  atualizarRascunho(id: string, form: AtualizarEntregaRascunhoForm): Observable<Entrega> {
    return this.http.put<Entrega>(`${this.base}/${id}/rascunho`, form);
  }

  cancelar(id: string): Observable<Entrega> {
    return this.http.post<Entrega>(`${this.base}/${id}/cancelar`, {});
  }

  reentregar(id: string): Observable<Entrega> {
    return this.http.post<Entrega>(`${this.base}/${id}/reentregar`, {});
  }

  iniciarGeracao(id: string): Observable<Entrega> {
    return this.http.post<Entrega>(`${this.base}/${id}/geracao/iniciar`, {});
  }

  baixarPacote(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pacote/download`, { responseType: 'blob' });
  }

  reagendarPublicacao(id: string): Observable<Entrega> {
    return this.http.post<Entrega>(`${this.base}/${id}/publicacao/reagendar`, {});
  }
}
