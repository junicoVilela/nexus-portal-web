import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { DeployInstalacao, DeployLoteResultado, ExecutarDeployForm, ManifestoImplantacao } from '../models/deploy-instalacao.model';

@Injectable({ providedIn: 'root' })
export class DeployInstalacaoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.releaseOrchestratorApiUrl}/deploys`;

  preview(releaseId: string, instalacaoId: string): Observable<ManifestoImplantacao> {
    const params = buildQueryParams({ releaseId, instalacaoId });
    return this.http.get<ManifestoImplantacao>(`${this.base}/preview`, { params });
  }

  executar(form: ExecutarDeployForm): Observable<DeployInstalacao> {
    return this.http.post<DeployInstalacao>(this.base, form);
  }

  executarLote(entregaId: string, modo: ExecutarDeployForm['modo'], forcar = false): Observable<DeployLoteResultado> {
    return this.http.post<DeployLoteResultado>(`${this.base}/lote`, { entregaId, modo, forcar }).pipe(
      map(r => ({ ...r, itens: r.itens ?? [] })),
    );
  }

  listar(
    page = 1,
    size = 20,
    filtros: { instalacaoId?: string; releaseId?: string; entregaId?: string } = {},
  ): Observable<PageResult<DeployInstalacao>> {
    const params = buildQueryParams({ page, size, ...filtros });
    return this.http
      .get<PageResult<DeployInstalacao>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }
}
