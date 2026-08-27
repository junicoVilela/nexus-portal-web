import { Injectable, Injector } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { SortDirection } from '@shared/utils/query-state';
import {
  docflowClienteAtualizar as atualizarClienteSdk,
  docflowClienteBuscar as buscarClienteSdk,
  docflowClienteCopiarVinculos as copiarVinculosClienteSdk,
  docflowClienteCriar as criarClienteSdk,
  docflowClienteDeleteLogo as removerLogoClienteSdk,
  docflowClienteExcluir as excluirClienteSdk,
  docflowPreviewGerarToken as gerarPreviewTokenSdk,
  docflowPreviewListar as listarPreviewTokensSdk,
  docflowClienteListar as listarClientesSdk,
  docflowPreviewRevogar as revogarPreviewTokenSdk,
  docflowClienteUploadLogo as uploadLogoClienteSdk,
  docflowClienteVincularModulos as vincularModulosClienteSdk,
  docflowClienteVincularPaginas as vincularPaginasClienteSdk,
  docflowClienteVincularProjetos as vincularProjetosClienteSdk,
  docflowClienteVinculos as vinculosClienteSdk,
} from '../../../api/generated/sdk.gen';
import type {
  ClienteRequest,
  ClienteResponse,
  PreviewTokenResponse,
} from '../../../api/generated/types.gen';
import { Cliente, PreviewToken } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly base = environment.apiUrl;

  constructor(private readonly injector: Injector) {}

  listarClientes(
    params: { nome?: string; sort?: string; dir?: SortDirection; page?: number; size?: number } = {},
  ): Observable<PageResult<Cliente>> {
    return defer(() => listarClientesSdk({ query: params, injector: this.injector })).pipe(
      map(resposta =>
        this.mapearPageResult(resposta.data, params.size, item => this.mapearCliente(item)),
      ),
    );
  }

  clientes(): Observable<Cliente[]> {
    return this.listarClientes({ page: 1, size: 1000 }).pipe(map(r => r.items));
  }

  cliente(id: string): Observable<Cliente> {
    return defer(() => buscarClienteSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => this.mapearCliente(resposta.data)),
    );
  }

  salvarCliente(payload: Partial<Cliente>, id?: string): Observable<Cliente> {
    const body = payload as ClienteRequest;
    return id
      ? defer(() =>
          atualizarClienteSdk({ path: { id }, body, injector: this.injector }),
        ).pipe(map(resposta => this.mapearCliente(resposta.data)))
      : defer(() => criarClienteSdk({ body, injector: this.injector })).pipe(
          map(resposta => this.mapearCliente(resposta.data)),
        );
  }

  excluirCliente(id: string): Observable<void> {
    return defer(() => excluirClienteSdk({ path: { id }, injector: this.injector })).pipe(
      map(() => undefined),
    );
  }

  vinculosCliente(
    id: string,
  ): Observable<{ projetoIds: string[]; moduloIds: string[]; paginaIds: string[] }> {
    return defer(() => vinculosClienteSdk({ path: { id }, injector: this.injector })).pipe(
      map(resposta => ({
        projetoIds: resposta.data['projetoIds'] ?? [],
        moduloIds: resposta.data['moduloIds'] ?? [],
        paginaIds: resposta.data['paginaIds'] ?? [],
      })),
    );
  }

  salvarProjetosCliente(id: string, projetoIds: string[]): Observable<void> {
    return defer(() =>
      vincularProjetosClienteSdk({
        path: { id },
        body: { projetoIds },
        injector: this.injector,
      }),
    ).pipe(map(() => undefined));
  }

  salvarModulosCliente(id: string, moduloIds: string[]): Observable<void> {
    return defer(() =>
      vincularModulosClienteSdk({
        path: { id },
        body: { moduloIds },
        injector: this.injector,
      }),
    ).pipe(map(() => undefined));
  }

  salvarPaginasCliente(id: string, paginaIds: string[]): Observable<void> {
    return defer(() =>
      vincularPaginasClienteSdk({
        path: { id },
        body: { paginaIds },
        injector: this.injector,
      }),
    ).pipe(map(() => undefined));
  }

  copiarVinculosCliente(destinoClienteId: string, origemClienteId: string): Observable<void> {
    return defer(() =>
      copiarVinculosClienteSdk({
        path: { id: destinoClienteId },
        body: { origemClienteId },
        injector: this.injector,
      }),
    ).pipe(map(() => undefined));
  }

  uploadLogoCliente(id: string, file: File): Observable<void> {
    return defer(() =>
      uploadLogoClienteSdk({ path: { id }, body: { file }, injector: this.injector }),
    ).pipe(map(() => undefined));
  }

  removerLogoCliente(id: string): Observable<void> {
    return defer(() => removerLogoClienteSdk({ path: { id }, injector: this.injector })).pipe(
      map(() => undefined),
    );
  }

  logoUrlCliente(id: string): string {
    return `${this.base}/clientes/${id}/logo`;
  }

  gerarPreviewToken(clienteId: string, horasValidade = 72): Observable<PreviewToken> {
    return defer(() =>
      gerarPreviewTokenSdk({
        query: { clienteId, horasValidade },
        injector: this.injector,
      }),
    ).pipe(map(resposta => this.mapearPreviewToken(resposta.data)));
  }

  listarPreviewTokens(clienteId: string): Observable<PreviewToken[]> {
    return defer(() =>
      listarPreviewTokensSdk({ query: { clienteId }, injector: this.injector }),
    ).pipe(map(resposta => resposta.data.map(item => this.mapearPreviewToken(item))));
  }

  revogarPreviewToken(id: string): Observable<void> {
    return defer(() => revogarPreviewTokenSdk({ path: { id }, injector: this.injector })).pipe(
      map(() => undefined),
    );
  }

  previewPublicoUrl(token: string): string {
    return `${this.base}/preview/${token}`;
  }

  private mapearCliente(item: ClienteResponse): Cliente {
    return item as Cliente;
  }

  private mapearPreviewToken(item: PreviewTokenResponse): PreviewToken {
    return {
      id: item.id ?? '',
      clienteId: item.clienteId ?? '',
      token: item.token ?? '',
      expiresAt: item.expiresAt ?? '',
      createdAt: item.createdAt ?? '',
      createdBy: item.createdBy,
    };
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
