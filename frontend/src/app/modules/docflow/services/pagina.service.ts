import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { defer, map, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '@env/environment';
import { TIMINGS } from '@core/config/timings';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import {
  aplicarTemplate,
  arquivarTemplate,
  atualizarTemplate,
  criarTemplate,
  duplicarTemplate,
  excluirTemplate,
  reativarTemplate,
  restaurarVersaoTemplate,
  templates,
  versoesTemplate,
} from '../../../api/generated/sdk.gen';
import type {
  PaginaTemplateAplicacaoResponse,
  PaginaTemplateResponse,
  PaginaTemplateVersaoResponse,
} from '../../../api/generated/types.gen';
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

  constructor(
    private readonly http: HttpClient,
    private readonly injector: Injector,
  ) {}

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

    const request = defer(() => templates({ query: filtros, injector: this.injector })).pipe(
      map(resposta => resposta.data.map(item => this.mapearTemplate(item))),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.templatesCache.set(chave, {
      expiresAt: agora + TIMINGS.serviceCacheTtlMs,
      request,
    });
    return request;
  }

  criarTemplatePagina(payload: PaginaTemplateCriacao): Observable<PaginaTemplate> {
    return defer(() => criarTemplate({ body: payload, injector: this.injector })).pipe(
      map(resposta => this.mapearTemplate(resposta.data)),
      tap(() => this.invalidarCacheTemplates()),
    );
  }

  excluirTemplatePagina(id: string): Observable<void> {
    return defer(() => excluirTemplate({ path: { templateId: id }, injector: this.injector })).pipe(
      map(() => undefined),
      tap(() => this.invalidarCacheTemplates()),
    );
  }

  atualizarTemplatePagina(id: string, payload: PaginaTemplateCriacao): Observable<PaginaTemplate> {
    return defer(() =>
      atualizarTemplate({
        path: { templateId: id },
        body: payload,
        injector: this.injector,
      }),
    ).pipe(
      map(resposta => this.mapearTemplate(resposta.data)),
      tap(() => this.invalidarCacheTemplates()),
    );
  }

  duplicarTemplatePagina(id: string, payload: PaginaTemplateDuplicacao): Observable<PaginaTemplate> {
    return defer(() =>
      duplicarTemplate({
        path: { templateId: id },
        body: payload,
        injector: this.injector,
      }),
    ).pipe(
      map(resposta => this.mapearTemplate(resposta.data)),
      tap(() => this.invalidarCacheTemplates()),
    );
  }

  aplicarTemplatePagina(id: string, payload: PaginaTemplateAplicacao): Observable<PaginaTemplateAplicada> {
    return defer(() =>
      aplicarTemplate({
        path: { templateId: id },
        body: payload,
        injector: this.injector,
      }),
    ).pipe(map(resposta => this.mapearAplicacaoTemplate(resposta.data)));
  }

  arquivarTemplatePagina(id: string): Observable<PaginaTemplate> {
    return defer(() => arquivarTemplate({ path: { templateId: id }, injector: this.injector })).pipe(
      map(resposta => this.mapearTemplate(resposta.data)),
      tap(() => this.invalidarCacheTemplates()),
    );
  }

  reativarTemplatePagina(id: string): Observable<PaginaTemplate> {
    return defer(() => reativarTemplate({ path: { templateId: id }, injector: this.injector })).pipe(
      map(resposta => this.mapearTemplate(resposta.data)),
      tap(() => this.invalidarCacheTemplates()),
    );
  }

  versoesTemplatePagina(id: string): Observable<PaginaTemplateVersao[]> {
    return defer(() => versoesTemplate({ path: { templateId: id }, injector: this.injector })).pipe(
      map(resposta => resposta.data.map(item => this.mapearVersaoTemplate(item))),
    );
  }

  restaurarVersaoTemplatePagina(id: string, numero: number): Observable<PaginaTemplate> {
    return defer(() =>
      restaurarVersaoTemplate({
        path: { templateId: id, numero },
        injector: this.injector,
      }),
    ).pipe(
      map(resposta => this.mapearTemplate(resposta.data)),
      tap(() => this.invalidarCacheTemplates()),
    );
  }

  private invalidarCacheTemplates(): void {
    this.templatesCache.clear();
  }

  private mapearTemplate(resposta: PaginaTemplateResponse): PaginaTemplate {
    return {
      id: this.campoObrigatorio(resposta.id, 'id'),
      codigo: this.campoObrigatorio(resposta.codigo, 'codigo'),
      nome: this.campoObrigatorio(resposta.nome, 'nome'),
      descricao: resposta.descricao,
      conteudoHtml: this.campoObrigatorio(resposta.conteudoHtml, 'conteudoHtml'),
      ordem: resposta.ordem ?? 0,
      ativo: resposta.ativo,
      personalizado: resposta.personalizado,
      versaoAtual: resposta.versaoAtual,
      paginasOriginadas: resposta.paginasOriginadas,
      projetoId: resposta.projetoId,
      projetoNome: resposta.projetoNome,
      clienteId: resposta.clienteId,
      clienteNome: resposta.clienteNome,
    };
  }

  private mapearAplicacaoTemplate(resposta: PaginaTemplateAplicacaoResponse): PaginaTemplateAplicada {
    return {
      templateId: this.campoObrigatorio(resposta.templateId, 'templateId'),
      versao: resposta.versao ?? 1,
      conteudoHtml: this.campoObrigatorio(resposta.conteudoHtml, 'conteudoHtml'),
      variaveisResolvidas: resposta.variaveisResolvidas ?? {},
      variaveisPendentes: resposta.variaveisPendentes ?? [],
    };
  }

  private mapearVersaoTemplate(resposta: PaginaTemplateVersaoResponse): PaginaTemplateVersao {
    return {
      id: this.campoObrigatorio(resposta.id, 'id'),
      numero: resposta.numero ?? 1,
      nome: this.campoObrigatorio(resposta.nome, 'nome'),
      descricao: resposta.descricao,
      conteudoHtml: this.campoObrigatorio(resposta.conteudoHtml, 'conteudoHtml'),
      ativo: resposta.ativo ?? true,
      projetoId: resposta.projetoId,
      clienteId: resposta.clienteId,
      paginasOriginadas: resposta.paginasOriginadas ?? 0,
      createdAt: this.campoObrigatorio(resposta.createdAt, 'createdAt'),
      createdBy: resposta.createdBy,
    };
  }

  private campoObrigatorio(valor: string | undefined, campo: string): string {
    if (valor === undefined) throw new Error(`Contrato inválido de template: campo ${campo} ausente.`);
    return valor;
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

  bibliotecaAnexos(busca = '', page = 1, size = 24): Observable<PageResult<PaginaAnexo>> {
    return this.http.get<PageResult<PaginaAnexo>>(`${this.base}/paginas/anexos`, {
      params: buildQueryParams({ busca, page, size }),
    });
  }

  comentarRevisaoPagina(id: string, comentario: string): Observable<PaginaRevisao> {
    return this.http.post<PaginaRevisao>(`${this.base}/paginas/${id}/revisoes/comentarios`, { comentario });
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
