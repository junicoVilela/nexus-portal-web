import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { Release, ReleaseForm, ReleaseStatus } from '../models/release.model';
import { ReleaseHistorico } from '../models/release-historico.model';

export interface ReleaseFilter {
  produtoId?: string;
  status?: ReleaseStatus;
  tipo?: string;
  responsavelId?: string;
  dataPrevistaInicio?: string;
  dataPrevistaFim?: string;
  dataPublicacaoInicio?: string;
  dataPublicacaoFim?: string;
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

@Injectable({ providedIn: 'root' })
export class ReleaseService {
  private readonly base = `${environment.releaseOrchestratorApiUrl}/releases`;

  constructor(private readonly http: HttpClient) {}

  listar(filter: ReleaseFilter): Observable<PageResult<Release>> {
    const params = buildQueryParams({ ...filter });
    return this.http
      .get<PageResult<Release>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  buscarPorId(id: string): Observable<Release> {
    return this.http.get<Release>(`${this.base}/${id}`);
  }

  criar(data: ReleaseForm): Observable<Release> {
    return this.http.post<Release>(this.base, data);
  }

  atualizar(id: string, data: ReleaseForm): Observable<Release> {
    return this.http.put<Release>(`${this.base}/${id}`, data);
  }

  alterarStatus(id: string, status: ReleaseStatus, observacao?: string): Observable<Release> {
    return this.http.patch<Release>(`${this.base}/${id}/status`, { status, observacao });
  }

  publicar(id: string): Observable<Release> {
    return this.http.post<Release>(`${this.base}/${id}/publicar`, {});
  }

  cancelar(id: string, motivo?: string): Observable<Release> {
    return this.http.post<Release>(`${this.base}/${id}/cancelar`, { motivo });
  }

  duplicar(id: string): Observable<Release> {
    return this.http.post<Release>(`${this.base}/${id}/duplicar`, {});
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listarHistorico(id: string): Observable<ReleaseHistorico[]> {
    return this.http.get<ReleaseHistorico[]>(`${this.base}/${id}/historico`).pipe(map(r => r ?? []));
  }

  validarRevisao(id: string): Observable<RevisaoValidacao> {
    return this.http.get<RevisaoValidacao>(`${this.base}/${id}/validar`);
  }
}

export interface RevisaoValidacao {
  valida: boolean;
  pendencias: string[];
  alertas: string[];
  totalItensCliente: number;
  totalItensInternos: number;
}
