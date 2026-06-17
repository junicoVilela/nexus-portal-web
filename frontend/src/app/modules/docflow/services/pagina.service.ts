import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import { Pagina, PaginaAnexo, PaginaRevisao, StatusPagina } from '../models/pagina.model';

@Injectable({ providedIn: 'root' })
export class PaginaService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listarPaginas(
    filtros: {
      busca?: string;
      titulo?: string;
      moduloId?: string;
      projetoId?: string;
      status?: StatusPagina;
      codigoTela?: string;
      sort?: string;
      dir?: SortDirection;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PageResult<Pagina>> {
    return this.http.get<PageResult<Pagina>>(`${this.base}/paginas`, {
      params: buildQueryParams(filtros),
    });
  }

  paginas(
    filtros: {
      busca?: string;
      titulo?: string;
      moduloId?: string;
      projetoId?: string;
      status?: StatusPagina;
      codigoTela?: string;
    } = {},
  ): Observable<Pagina[]> {
    return this.listarPaginas({ ...filtros, page: 1, size: 1000 }).pipe(map(r => r.items));
  }

  pagina(id: string): Observable<Pagina> {
    return this.http.get<Pagina>(`${this.base}/paginas/${id}`);
  }

  salvarPagina(payload: Partial<Pagina>, id?: string): Observable<Pagina> {
    return id
      ? this.http.put<Pagina>(`${this.base}/paginas/${id}`, payload)
      : this.http.post<Pagina>(`${this.base}/paginas`, payload);
  }

  salvarRascunho(id: string): Observable<Pagina> {
    return this.http.post<Pagina>(`${this.base}/paginas/${id}/salvar-rascunho`, {});
  }

  publicarPagina(id: string): Observable<Pagina> {
    return this.http.post<Pagina>(`${this.base}/paginas/${id}/publicar`, {});
  }

  enviarRevisaoPagina(id: string): Observable<Pagina> {
    return this.http.post<Pagina>(`${this.base}/paginas/${id}/enviar-revisao`, {});
  }

  aprovarPagina(id: string): Observable<Pagina> {
    return this.http.post<Pagina>(`${this.base}/paginas/${id}/aprovar`, {});
  }

  arquivarPagina(id: string): Observable<Pagina> {
    return this.http.post<Pagina>(`${this.base}/paginas/${id}/arquivar`, {});
  }

  duplicarPagina(id: string): Observable<Pagina> {
    return this.http.post<Pagina>(`${this.base}/paginas/${id}/duplicar`, {});
  }

  listarRevisoesPagina(
    id: string,
    page = 1,
    size = 10,
    sort?: string,
    dir?: SortDirection,
  ): Observable<PageResult<PaginaRevisao>> {
    return this.http.get<PageResult<PaginaRevisao>>(`${this.base}/paginas/${id}/revisoes`, {
      params: buildQueryParams({ page, size, sort, dir }),
    });
  }

  anexosPagina(id: string): Observable<PaginaAnexo[]> {
    return this.http.get<PaginaAnexo[]>(`${this.base}/paginas/${id}/anexos`);
  }

  anexarPagina(id: string, file: File): Observable<PaginaAnexo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PaginaAnexo>(`${this.base}/paginas/${id}/anexos`, formData);
  }

  excluirAnexoPagina(paginaId: string, anexoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/paginas/${paginaId}/anexos/${anexoId}`);
  }

  downloadAnexoUrl(anexo: PaginaAnexo): string {
    return `${this.base}${anexo.downloadUrl}`;
  }

  buscarPaginas(termo: string, page = 1, size = 10): Observable<PageResult<Pagina>> {
    return this.listarPaginas({ busca: termo, page, size });
  }

  resumoPaginasPorStatusGlobal(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.base}/paginas/resumo-por-status`);
  }

  reordenarPaginas(paginaIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.base}/paginas/reordenar`, { paginaIds });
  }
}
