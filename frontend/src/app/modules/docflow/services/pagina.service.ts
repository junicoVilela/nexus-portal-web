import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '@env/environment';
import { TIMINGS } from '@core/config/timings';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import {
  Pagina,
  PaginaAnexo,
  PaginaQualidade,
  PaginaRevisao,
  PaginaTemplate,
  PaginaTemplateAplicacao,
  PaginaTemplateAplicada,
  PaginaTemplateCriacao,
  PaginaTemplateDuplicacao,
  PaginaTemplateVersao,
  StatusPagina,
} from '../models/pagina.model';

@Injectable({ providedIn: 'root' })
export class PaginaService {
  private readonly base = environment.apiUrl;
  private readonly templatesCache = new Map<
    string,
    { expiresAt: number; request: Observable<PaginaTemplate[]> }
  >();

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

  templatesPagina(
    filtros: {
      projetoId?: string;
      clienteId?: string;
      somenteContexto?: boolean;
      incluirArquivados?: boolean;
    } = {},
  ): Observable<PaginaTemplate[]> {
    const chave = JSON.stringify({
      projetoId: filtros.projetoId ?? '',
      clienteId: filtros.clienteId ?? '',
      somenteContexto: filtros.somenteContexto ?? true,
      incluirArquivados: filtros.incluirArquivados ?? false,
    });
    const agora = Date.now();
    const cache = this.templatesCache.get(chave);
    if (cache && cache.expiresAt > agora) return cache.request;

    const request = this.http
      .get<PaginaTemplate[]>(`${this.base}/paginas/templates`, {
        params: buildQueryParams(filtros),
      })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.templatesCache.set(chave, {
      expiresAt: agora + TIMINGS.serviceCacheTtlMs,
      request,
    });
    return request;
  }

  criarTemplatePagina(payload: PaginaTemplateCriacao): Observable<PaginaTemplate> {
    return this.http
      .post<PaginaTemplate>(`${this.base}/paginas/templates`, payload)
      .pipe(tap(() => this.invalidarCacheTemplates()));
  }

  excluirTemplatePagina(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/paginas/templates/${id}`)
      .pipe(tap(() => this.invalidarCacheTemplates()));
  }

  atualizarTemplatePagina(id: string, payload: PaginaTemplateCriacao): Observable<PaginaTemplate> {
    return this.http
      .put<PaginaTemplate>(`${this.base}/paginas/templates/${id}`, payload)
      .pipe(tap(() => this.invalidarCacheTemplates()));
  }

  duplicarTemplatePagina(id: string, payload: PaginaTemplateDuplicacao): Observable<PaginaTemplate> {
    return this.http
      .post<PaginaTemplate>(`${this.base}/paginas/templates/${id}/duplicar`, payload)
      .pipe(tap(() => this.invalidarCacheTemplates()));
  }

  aplicarTemplatePagina(id: string, payload: PaginaTemplateAplicacao): Observable<PaginaTemplateAplicada> {
    return this.http.post<PaginaTemplateAplicada>(`${this.base}/paginas/templates/${id}/aplicar`, payload);
  }

  arquivarTemplatePagina(id: string): Observable<PaginaTemplate> {
    return this.http
      .post<PaginaTemplate>(`${this.base}/paginas/templates/${id}/arquivar`, {})
      .pipe(tap(() => this.invalidarCacheTemplates()));
  }

  reativarTemplatePagina(id: string): Observable<PaginaTemplate> {
    return this.http
      .post<PaginaTemplate>(`${this.base}/paginas/templates/${id}/reativar`, {})
      .pipe(tap(() => this.invalidarCacheTemplates()));
  }

  versoesTemplatePagina(id: string): Observable<PaginaTemplateVersao[]> {
    return this.http.get<PaginaTemplateVersao[]>(`${this.base}/paginas/templates/${id}/versoes`);
  }

  restaurarVersaoTemplatePagina(id: string, numero: number): Observable<PaginaTemplate> {
    return this.http
      .post<PaginaTemplate>(`${this.base}/paginas/templates/${id}/versoes/${numero}/restaurar`, {})
      .pipe(tap(() => this.invalidarCacheTemplates()));
  }

  private invalidarCacheTemplates(): void {
    this.templatesCache.clear();
  }

  salvarPagina(payload: Partial<Pagina>, id?: string): Observable<Pagina> {
    return id
      ? this.http.put<Pagina>(`${this.base}/paginas/${id}`, payload)
      : this.http.post<Pagina>(`${this.base}/paginas`, payload);
  }

  excluirPagina(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/paginas/${id}`);
  }

  autosavePagina(id: string, payload: Partial<Pagina>): Observable<Pagina> {
    return this.http.put<Pagina>(`${this.base}/paginas/${id}/autosave`, payload);
  }

  qualidadePagina(id: string): Observable<PaginaQualidade> {
    return this.http.get<PaginaQualidade>(`${this.base}/paginas/${id}/qualidade`);
  }

  previewPaginaHtml(id: string): Observable<string> {
    return this.http.get(`${this.base}/paginas/${id}/preview`, { responseType: 'text' });
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
