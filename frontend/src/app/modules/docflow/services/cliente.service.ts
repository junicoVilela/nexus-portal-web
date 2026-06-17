import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { SortDirection } from '@shared/utils/query-state';
import { Cliente, PreviewToken } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listarClientes(
    params: { nome?: string; sort?: string; dir?: SortDirection; page?: number; size?: number } = {},
  ): Observable<PageResult<Cliente>> {
    return this.http.get<PageResult<Cliente>>(`${this.base}/clientes`, {
      params: buildQueryParams(params),
    });
  }

  clientes(): Observable<Cliente[]> {
    return this.listarClientes({ page: 1, size: 1000 }).pipe(map(r => r.items));
  }

  cliente(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/clientes/${id}`);
  }

  salvarCliente(payload: Partial<Cliente>, id?: string): Observable<Cliente> {
    return id
      ? this.http.put<Cliente>(`${this.base}/clientes/${id}`, payload)
      : this.http.post<Cliente>(`${this.base}/clientes`, payload);
  }

  vinculosCliente(
    id: string,
  ): Observable<{ projetoIds: string[]; moduloIds: string[]; paginaIds: string[] }> {
    return this.http.get<{ projetoIds: string[]; moduloIds: string[]; paginaIds: string[] }>(
      `${this.base}/clientes/${id}/vinculos`,
    );
  }

  salvarProjetosCliente(id: string, projetoIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/clientes/${id}/projetos`, { projetoIds });
  }

  salvarModulosCliente(id: string, moduloIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/clientes/${id}/modulos`, { moduloIds });
  }

  salvarPaginasCliente(id: string, paginaIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/clientes/${id}/paginas`, { paginaIds });
  }

  copiarVinculosCliente(destinoClienteId: string, origemClienteId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/clientes/${destinoClienteId}/copiar-vinculos`, {
      origemClienteId,
    });
  }

  uploadLogoCliente(id: string, file: File): Observable<void> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<void>(`${this.base}/clientes/${id}/logo`, fd);
  }

  removerLogoCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/clientes/${id}/logo`);
  }

  logoUrlCliente(id: string): string {
    return `${this.base}/clientes/${id}/logo`;
  }

  gerarPreviewToken(clienteId: string, horasValidade = 72): Observable<PreviewToken> {
    const params = new HttpParams().set('clienteId', clienteId).set('horasValidade', horasValidade);
    return this.http.post<PreviewToken>(`${this.base}/preview-tokens`, null, { params });
  }

  listarPreviewTokens(clienteId: string): Observable<PreviewToken[]> {
    return this.http.get<PreviewToken[]>(`${this.base}/preview-tokens`, {
      params: new HttpParams().set('clienteId', clienteId),
    });
  }

  revogarPreviewToken(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/preview-tokens/${id}`);
  }

  previewPublicoUrl(token: string): string {
    return `${this.base}/preview/${token}`;
  }
}
