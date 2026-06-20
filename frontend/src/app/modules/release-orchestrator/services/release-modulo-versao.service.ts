import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { ReleaseModuloVersao } from '../models/release-modulo-versao.model';

/**
 * Vínculo release ↔ versão por módulo.
 * Endpoints: `/api/v1/release-orchestrator/releases/{releaseId}/modulos-versao/...`
 */
@Injectable({ providedIn: 'root' })
export class ReleaseModuloVersaoService {
  private readonly http = inject(HttpClient);

  private base(releaseId: string): string {
    return `${environment.releaseOrchestratorApiUrl}/releases/${releaseId}/modulos-versao`;
  }

  listar(releaseId: string): Observable<ReleaseModuloVersao[]> {
    return this.http.get<ReleaseModuloVersao[]>(this.base(releaseId));
  }

  salvar(releaseId: string, moduloProdutoId: string, versao: string): Observable<ReleaseModuloVersao> {
    return this.http.put<ReleaseModuloVersao>(
      `${this.base(releaseId)}/${moduloProdutoId}`,
      { versao },
    );
  }

  remover(releaseId: string, moduloProdutoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(releaseId)}/${moduloProdutoId}`);
  }
}
