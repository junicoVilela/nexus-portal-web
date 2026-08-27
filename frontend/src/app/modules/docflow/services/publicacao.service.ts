import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import {
  arvorePaginas as arvorePaginasPublicacaoSdk,
  buscar18 as buscarPublicacaoSdk,
  changelog as changelogPublicacaoSdk,
  diagnostico as diagnosticoPublicacaoSdk,
  emitirTokenDownload as emitirTokenDownloadSdk,
  excluir14 as excluirPublicacaoSdk,
  gerar as gerarPublicacaoSdk,
  listar18 as listarPublicacoesSdk,
  preview1 as previewPublicacaoSdk,
  previewHtml as previewPublicacaoHtmlSdk,
  reprocessar as reprocessarPublicacaoSdk,
  reprocessarLote as reprocessarLoteSdk,
} from '../../../api/generated/sdk.gen';
import type {
  ChangelogItemResponse,
  DownloadTokenResponse,
  Listar18Data,
  PublicacaoPaginaSnapshotItem,
  PublicacaoResponse,
} from '../../../api/generated/types.gen';
import { ChangelogItem } from '../models/pagina.model';
import { Pagina } from '../models/pagina.model';
import {
  Publicacao,
  PublicacaoDiff,
  PublicacaoPaginaSnapshot,
  ReprocessamentoPublicacoes,
} from '../models/publicacao.model';

@Injectable({ providedIn: 'root' })
export class PublicacaoService {
  private readonly base = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly injector: Injector,
  ) {}

  eventosPublicacao(): Observable<{
    id: string;
    clienteId: string;
    status: Publicacao['status'];
    versao: string;
  }> {
    return new Observable(observer => {
      const controller = new AbortController();
      const token = localStorage.getItem('doc-flow-jwt');
      const authorization = token ? `Bearer ${token}` : null;
      void fetch(`${this.base}/publicacoes/eventos`, {
        signal: controller.signal,
        headers: authorization ? { Authorization: authorization } : {},
      })
        .then(async response => {
          if (!response.ok || !response.body) {
            throw new Error(`Stream de publicações indisponível (${response.status}).`);
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
              if (tipo === 'publicacao' && dados) observer.next(JSON.parse(dados));
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

  listarPublicacoes(
    params: {
      clienteId?: string;
      status?: Publicacao['status'];
      sort?: string;
      dir?: SortDirection;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PageResult<Publicacao>> {
    return defer(() =>
      listarPublicacoesSdk({
        query: {
          clienteId: params.clienteId,
          sort: params.sort,
          dir: params.dir,
          page: params.page,
          size: params.size,
          ...(params.status ? { status: params.status } : {}),
        } as Listar18Data['query'],
        injector: this.injector,
      }),
    ).pipe(
      map(resposta => ({
        items: (resposta.data.items ?? []).map(item => this.mapearPublicacao(item)),
        totalItems: resposta.data.totalItems ?? 0,
        totalPages: resposta.data.totalPages ?? 0,
        page: resposta.data.page ?? 1,
        size: resposta.data.size ?? params.size ?? 10,
        first: resposta.data.first ?? true,
        last: resposta.data.last ?? true,
      })),
    );
  }

  publicacoes(clienteId?: string): Observable<Publicacao[]> {
    return this.listarPublicacoes({ clienteId, page: 1, size: 1000 }).pipe(map(r => r.items));
  }

  publicacaoPorId(publicacaoId: string): Observable<Publicacao> {
    return defer(() =>
      buscarPublicacaoSdk({ path: { id: publicacaoId }, injector: this.injector }),
    ).pipe(map(resposta => this.mapearPublicacao(resposta.data)));
  }

  previewPublicacao(clienteId: string): Observable<Pagina[]> {
    return defer(() =>
      previewPublicacaoSdk({ query: { clienteId }, injector: this.injector }),
    ).pipe(map(resposta => resposta.data as Pagina[]));
  }

  previewPublicacaoHtml(clienteId: string, versao?: string): Observable<string> {
    return defer(() =>
      previewPublicacaoHtmlSdk({
        query: { clienteId, versao },
        injector: this.injector,
      }),
    ).pipe(map(resposta => resposta.data));
  }

  diagnosticoPublicacao(
    clienteId: string,
  ): Observable<{ severidade: string; mensagem: string; paginaId?: string; paginaTitulo?: string }[]> {
    return defer(() =>
      diagnosticoPublicacaoSdk({ query: { clienteId }, injector: this.injector }),
    ).pipe(
      map(resposta =>
        resposta.data.map(item => ({
          severidade: item.severidade ?? '',
          mensagem: item.mensagem ?? '',
          paginaId: item.paginaId,
          paginaTitulo: item.paginaTitulo,
        })),
      ),
    );
  }

  gerarPublicacao(payload: {
    clienteId: string;
    versao: string;
    observacao?: string;
  }): Observable<Publicacao> {
    return defer(() =>
      gerarPublicacaoSdk({ body: payload, injector: this.injector }),
    ).pipe(map(resposta => this.mapearPublicacao(resposta.data)));
  }

  reprocessarPublicacao(publicacaoId: string): Observable<Publicacao> {
    return defer(() =>
      reprocessarPublicacaoSdk({ path: { id: publicacaoId }, injector: this.injector }),
    ).pipe(map(resposta => this.mapearPublicacao(resposta.data)));
  }

  /**
   * Pede o cancelamento da geração. O worker termina o que está fazendo,
   * descarta o pacote e a publicação fica CANCELADA — não é imediato.
   */
  cancelarPublicacao(publicacaoId: string): Observable<Publicacao> {
    return this.http
      .post<PublicacaoResponse>(`${this.base}/publicacoes/${publicacaoId}/cancelar`, {})
      .pipe(map(resposta => this.mapearPublicacao(resposta)));
  }

  /**
   * @param comparadaCom publicação de referência; sem ela, a API compara com a
   *   publicação concluída imediatamente anterior do mesmo cliente.
   */
  diffPublicacao(publicacaoId: string, comparadaCom?: string): Observable<PublicacaoDiff> {
    return this.http
      .get<PublicacaoDiff>(`${this.base}/publicacoes/${publicacaoId}/diff`, {
        params: buildQueryParams({ comparadaCom }),
      })
      .pipe(map(resposta => this.mapearDiff(resposta)));
  }

  reprocessarPublicacoes(ids: string[]): Observable<ReprocessamentoPublicacoes> {
    return defer(() =>
      reprocessarLoteSdk({ body: { ids }, injector: this.injector }),
    ).pipe(
      map(resposta => ({
        solicitadas: resposta.data.solicitadas ?? 0,
        reprocessadas: resposta.data.reprocessadas ?? 0,
        ignoradas: resposta.data.ignoradas ?? 0,
        publicacoes: (resposta.data.publicacoes ?? []).map(item => this.mapearPublicacao(item)),
      })),
    );
  }

  excluirPublicacao(publicacaoId: string): Observable<void> {
    return defer(() =>
      excluirPublicacaoSdk({ path: { id: publicacaoId }, injector: this.injector }),
    ).pipe(map(() => undefined));
  }

  baixarPublicacao(publicacaoId: string): Observable<Blob> {
    return this.http.get(`${this.base}/publicacoes/${publicacaoId}/download`, {
      responseType: 'blob',
    });
  }

  downloadUrl(publicacaoId: string): string {
    return `${this.base}/publicacoes/${publicacaoId}/download`;
  }

  tokenDownloadPacote(
    publicacaoId: string,
  ): Observable<{ token: string; validadeSegundos: number; urlPath: string }> {
    return defer(() =>
      emitirTokenDownloadSdk({ path: { id: publicacaoId }, injector: this.injector }),
    ).pipe(map(resposta => this.mapearTokenDownload(resposta.data)));
  }

  montarUrlDownloadPacotePublico(
    token: string,
    urlPath = `${this.base}/public/publicacoes/download`,
  ): string {
    const path = `${urlPath}?token=${encodeURIComponent(token)}`;
    return new URL(path, window.location.origin).toString();
  }

  downloadPdfUrl(publicacaoId: string): string {
    return `${this.base}/publicacoes/${publicacaoId}/download-pdf`;
  }

  baixarPdf(publicacaoId: string): Observable<Blob> {
    return this.http.get(`${this.base}/publicacoes/${publicacaoId}/download-pdf`, {
      responseType: 'blob',
    });
  }

  changelogPublicacao(publicacaoId: string): Observable<ChangelogItem[]> {
    return defer(() =>
      changelogPublicacaoSdk({ path: { id: publicacaoId }, injector: this.injector }),
    ).pipe(map(resposta => resposta.data.map(item => this.mapearChangelog(item))));
  }

  arvorePaginasPublicacao(id: string): Observable<PublicacaoPaginaSnapshot[]> {
    return defer(() =>
      arvorePaginasPublicacaoSdk({ path: { id }, injector: this.injector }),
    ).pipe(map(resposta => resposta.data.map(item => this.mapearPaginaSnapshot(item))));
  }

  private mapearPublicacao(item: PublicacaoResponse): Publicacao {
    return {
      id: item.id ?? '',
      clienteId: item.clienteId ?? '',
      clienteNome: item.clienteNome ?? '',
      versao: item.versao ?? '',
      status: item.status ?? 'GERANDO',
      quantidadePaginas: item.quantidadePaginas ?? 0,
      quantidadeModulos: item.quantidadeModulos ?? 0,
      arquivoZipNome: item.arquivoZipNome,
      hashPacote: item.hashPacote,
      observacao: item.observacao,
      relatorioValidacao: item.relatorioValidacao,
      cancelamentoSolicitado: (item as { cancelamentoSolicitado?: boolean }).cancelamentoSolicitado ?? false,
      createdAt: item.createdAt ?? '',
      createdBy: item.createdBy ?? '',
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    };
  }

  private mapearDiff(resposta: PublicacaoDiff): PublicacaoDiff {
    return {
      publicacaoId: resposta.publicacaoId ?? '',
      versao: resposta.versao ?? '',
      comparadaComId: resposta.comparadaComId ?? '',
      versaoComparada: resposta.versaoComparada ?? '',
      totaisPorMudanca: resposta.totaisPorMudanca ?? {},
      itens: resposta.itens ?? [],
    };
  }

  private mapearPaginaSnapshot(item: PublicacaoPaginaSnapshotItem): PublicacaoPaginaSnapshot {
    const snapshot: PublicacaoPaginaSnapshot = {
      id: item.id ?? '',
      titulo: item.titulo ?? '',
      ordem: item.ordem ?? 0,
      nivel: item.nivel ?? 0,
    };
    if (item.parentId) snapshot.parentId = item.parentId;
    if (item.codigoTela) snapshot.codigoTela = item.codigoTela;
    if (item.slug) snapshot.slug = item.slug;
    return snapshot;
  }

  private mapearChangelog(item: ChangelogItemResponse): ChangelogItem {
    return {
      id: item.id ?? '',
      paginaId: item.paginaId,
      paginaTitulo: item.paginaTitulo ?? '',
      tipoMudanca: item.tipoMudanca as ChangelogItem['tipoMudanca'],
      createdAt: item.createdAt ?? '',
    };
  }

  private mapearTokenDownload(item: DownloadTokenResponse): {
    token: string;
    validadeSegundos: number;
    urlPath: string;
  } {
    return {
      token: item.token ?? '',
      validadeSegundos: item.validadeSegundos ?? 0,
      urlPath: item.urlPath ?? `${this.base}/public/publicacoes/download`,
    };
  }
}
