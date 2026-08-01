import { Injectable, Injector } from '@angular/core';
import { defer, map, Observable, shareReplay, tap } from 'rxjs';
import { environment } from '@env/environment';
import { TIMINGS } from '@core/config/timings';
import { PageResult } from '@shared/models/page-result.model';
import { SortDirection } from '@shared/utils/query-state';
import {
  anexar as anexarPaginaSdk,
  anexos as anexosPaginaSdk,
  bibliotecaAnexos as bibliotecaAnexosSdk,
  aplicarTemplate,
  aprovar as aprovarPaginaSdk,
  arquivar as arquivarPaginaSdk,
  arquivarTemplate,
  comentarRevisao as comentarRevisaoSdk,
  atualizar16 as atualizarPaginaSdk,
  atualizarTemplate,
  autosave as autosavePaginaSdk,
  buscar14 as buscarPaginaSdk,
  criar15 as criarPaginaSdk,
  criarTemplate,
  duplicar2 as duplicarPaginaSdk,
  duplicarTemplate,
  enviarRevisao as enviarRevisaoPaginaSdk,
  excluir11 as excluirPaginaSdk,
  excluirAnexo as excluirAnexoPaginaSdk,
  excluirTemplate,
  listar20 as listarPaginasSdk,
  preview2 as previewPaginaHtmlSdk,
  publicar1 as publicarPaginaSdk,
  qualidade as qualidadePaginaSdk,
  reativarTemplate,
  reordenar1 as reordenarPaginasSdk,
  restaurarVersaoTemplate,
  resumoPorStatusGlobal as resumoPaginasPorStatusGlobalSdk,
  revisoes as revisoesPaginaSdk,
  salvarRascunho as salvarRascunhoPaginaSdk,
  templates,
  versoesTemplate,
} from '../../../api/generated/sdk.gen';
import type {
  PaginaEventoResponse,
  PaginaRequest,
  PaginaResponse,
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

  constructor(private readonly injector: Injector) {}

  eventosPagina(): Observable<PaginaEventoResponse> {
    return new Observable(observer => {
      const controller = new AbortController();
      const token = localStorage.getItem('doc-flow-jwt');
      const authorization = token ? `Bearer ${token}` : null;
      void fetch(`${this.base}/paginas/eventos`, {
        signal: controller.signal,
        headers: authorization ? { Authorization: authorization } : {},
      })
        .then(async response => {
          if (!response.ok || !response.body) {
            throw new Error(`Stream de páginas indisponível (${response.status}).`);
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const eventos = buffer.split(/\r?\n\r?\n/);
            buffer = eventos.pop() ?? '';
            for (const evento of eventos) {
              const tipo = evento.match(/^event:\s*(.+)$/m)?.[1];
              const dados = evento.match(/^data:\s*(.+)$/m)?.[1];
              if (tipo === 'pagina' && dados) observer.next(JSON.parse(dados));
            }
          }
          if (!controller.signal.aborted) observer.complete();
        })
        .catch(error => {
          if (!controller.signal.aborted) observer.error(error);
        });
      return () => controller.abort();
    });
  }

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
    return defer(() =>
      listarPaginasSdk({ query: filtros, injector: this.injector }),
    ).pipe(map(resposta => this.mapearPageResult(resposta.data, filtros.size, item => this.mapearPagina(item))));
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
    return defer(() => buscarPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearPagina(resposta.data)),
    );
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
    const body = payload as PaginaRequest;
    return id
      ? defer(() =>
          atualizarPaginaSdk({ path: { id }, body, injector: this.injector }),
        ).pipe(map(resposta => this.mapearPagina(resposta.data)))
      : defer(() => criarPaginaSdk({ body, injector: this.injector })).pipe(
          map(resposta => this.mapearPagina(resposta.data)),
        );
  }

  excluirPagina(id: string): Observable<void> {
    return defer(() => excluirPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(() => undefined),
    );
  }

  autosavePagina(id: string, payload: Partial<Pagina>): Observable<Pagina> {
    return defer(() =>
      autosavePaginaSdk({
        path: { id },
        body: payload as PaginaRequest,
        injector: this.injector,
      }),
    ).pipe(map(resposta => this.mapearPagina(resposta.data)));
  }

  qualidadePagina(id: string): Observable<PaginaQualidade> {
    return defer(() => qualidadePaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => resposta.data as PaginaQualidade),
    );
  }

  previewPaginaHtml(id: string): Observable<string> {
    return defer(() => previewPaginaHtmlSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => resposta.data),
    );
  }

  salvarRascunho(id: string): Observable<Pagina> {
    return defer(() => salvarRascunhoPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearPagina(resposta.data)),
    );
  }

  publicarPagina(id: string): Observable<Pagina> {
    return defer(() => publicarPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearPagina(resposta.data)),
    );
  }

  enviarRevisaoPagina(id: string): Observable<Pagina> {
    return defer(() => enviarRevisaoPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearPagina(resposta.data)),
    );
  }

  aprovarPagina(id: string): Observable<Pagina> {
    return defer(() => aprovarPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearPagina(resposta.data)),
    );
  }

  arquivarPagina(id: string): Observable<Pagina> {
    return defer(() => arquivarPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearPagina(resposta.data)),
    );
  }

  duplicarPagina(id: string): Observable<Pagina> {
    return defer(() => duplicarPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearPagina(resposta.data)),
    );
  }

  listarRevisoesPagina(
    id: string,
    page = 1,
    size = 10,
    sort?: string,
    dir?: SortDirection,
  ): Observable<PageResult<PaginaRevisao>> {
    return defer(() =>
      revisoesPaginaSdk({
        path: { id },
        query: { page, size, sort, dir },
        injector: this.injector,
      }),
    ).pipe(
      map(resposta =>
        this.mapearPageResult(resposta.data as PageResult<PaginaRevisao>, size) as PageResult<PaginaRevisao>,
      ),
    );
  }

  anexosPagina(id: string): Observable<PaginaAnexo[]> {
    return defer(() => anexosPaginaSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => resposta.data as PaginaAnexo[]),
    );
  }

  bibliotecaAnexos(busca = '', page = 1, size = 24): Observable<PageResult<PaginaAnexo>> {
    return defer(() =>
      bibliotecaAnexosSdk({ query: { busca, page, size }, injector: this.injector }),
    ).pipe(
      map(resposta =>
        this.mapearPageResult(resposta.data, size, item => item as PaginaAnexo),
      ),
    );
  }

  comentarRevisaoPagina(id: string, comentario: string): Observable<PaginaRevisao> {
    return defer(() =>
      comentarRevisaoSdk({ path: { id }, body: { comentario }, injector: this.injector }),
    ).pipe(map(resposta => resposta.data as PaginaRevisao));
  }

  anexarPagina(id: string, file: File): Observable<PaginaAnexo> {
    return defer(() =>
      anexarPaginaSdk({ path: { id }, body: { file }, injector: this.injector }),
    ).pipe(map(resposta => resposta.data as PaginaAnexo));
  }

  excluirAnexoPagina(paginaId: string, anexoId: string): Observable<void> {
    return defer(() =>
      excluirAnexoPaginaSdk({
        path: { paginaId, anexoId },
        injector: this.injector,
      }),
    ).pipe(map(() => undefined));
  }

  downloadAnexoUrl(anexo: PaginaAnexo): string {
    return `${this.base}${anexo.downloadUrl}`;
  }

  buscarPaginas(termo: string, page = 1, size = 10): Observable<PageResult<Pagina>> {
    return this.listarPaginas({ busca: termo, page, size });
  }

  resumoPaginasPorStatusGlobal(): Observable<Record<string, number>> {
    return defer(() => resumoPaginasPorStatusGlobalSdk({ injector: this.injector })).pipe(
      map(resposta => resposta.data),
    );
  }

  reordenarPaginas(paginaIds: string[]): Observable<void> {
    return defer(() =>
      reordenarPaginasSdk({ body: { paginaIds }, injector: this.injector }),
    ).pipe(map(() => undefined));
  }

  private mapearPagina(resposta: PaginaResponse): Pagina {
    return resposta as Pagina;
  }

  private mapearPageResult<TSource, TTarget>(
    data: {
      items?: TSource[];
      totalItems?: number;
      totalPages?: number;
      page?: number;
      size?: number;
      first?: boolean;
      last?: boolean;
    },
    defaultSize = 10,
    mapItem: (item: TSource) => TTarget = item => item as unknown as TTarget,
  ): PageResult<TTarget> {
    return {
      items: (data.items ?? []).map(mapItem),
      totalItems: data.totalItems ?? 0,
      totalPages: data.totalPages ?? 0,
      page: data.page ?? 1,
      size: data.size ?? defaultSize,
      first: data.first ?? true,
      last: data.last ?? true,
    };
  }
}
