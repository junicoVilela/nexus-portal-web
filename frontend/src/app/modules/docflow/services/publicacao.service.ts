import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import { Publicacao } from '../models/publicacao.model';
import { Pagina } from '../models/pagina.model';
import { ChangelogItem } from '../models/pagina.model';

@Injectable({ providedIn: 'root' })
export class PublicacaoService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  eventosPublicacao(): Observable<{
    id: string;
    clienteId: string;
    status: 'GERANDO' | 'SUCESSO' | 'ERRO';
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
    params: { clienteId?: string; sort?: string; dir?: SortDirection; page?: number; size?: number } = {},
  ): Observable<PageResult<Publicacao>> {
    return this.http.get<PageResult<Publicacao>>(`${this.base}/publicacoes`, {
      params: buildQueryParams(params),
    });
  }

  publicacoes(clienteId?: string): Observable<Publicacao[]> {
    return this.listarPublicacoes({ clienteId, page: 1, size: 1000 }).pipe(map(r => r.items));
  }

  publicacaoPorId(publicacaoId: string): Observable<Publicacao> {
    return this.http.get<Publicacao>(`${this.base}/publicacoes/${publicacaoId}`);
  }

  previewPublicacao(clienteId: string): Observable<Pagina[]> {
    return this.http.get<Pagina[]>(`${this.base}/publicacoes/preview`, {
      params: new HttpParams().set('clienteId', clienteId),
    });
  }

  previewPublicacaoHtml(clienteId: string, versao?: string): Observable<string> {
    let params = new HttpParams().set('clienteId', clienteId);
    if (versao) params = params.set('versao', versao);
    return this.http.get(`${this.base}/publicacoes/preview-html`, { params, responseType: 'text' });
  }

  diagnosticoPublicacao(
    clienteId: string,
  ): Observable<{ severidade: string; mensagem: string; paginaId?: string; paginaTitulo?: string }[]> {
    return this.http.get<
      { severidade: string; mensagem: string; paginaId?: string; paginaTitulo?: string }[]
    >(`${this.base}/publicacoes/diagnostico`, {
      params: new HttpParams().set('clienteId', clienteId),
    });
  }

  gerarPublicacao(payload: {
    clienteId: string;
    versao: string;
    observacao?: string;
  }): Observable<Publicacao> {
    return this.http.post<Publicacao>(`${this.base}/publicacoes`, payload);
  }

  reprocessarPublicacao(publicacaoId: string): Observable<Publicacao> {
    return this.http.post<Publicacao>(`${this.base}/publicacoes/${publicacaoId}/reprocessar`, {});
  }

  excluirPublicacao(publicacaoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/publicacoes/${publicacaoId}`);
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
    return this.http.get<{ token: string; validadeSegundos: number; urlPath: string }>(
      `${this.base}/publicacoes/${publicacaoId}/download-token`,
    );
  }

  montarUrlDownloadPacotePublico(token: string): string {
    return `${this.base}/public/publicacoes/download?token=${encodeURIComponent(token)}`;
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
    return this.http.get<ChangelogItem[]>(`${this.base}/publicacoes/${publicacaoId}/changelog`);
  }
}
