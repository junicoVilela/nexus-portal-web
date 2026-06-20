import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { ArtefatoReleaseModulo } from '../models/artefato-release-modulo.model';

/**
 * Upload/listar/download/excluir artefatos de release por módulo.
 * Endpoints: `/api/v1/release-orchestrator/releases/{releaseId}/modulos/{moduloId}/artefatos/...`
 */
@Injectable({ providedIn: 'root' })
export class ArtefatoReleaseModuloService {
  private readonly http = inject(HttpClient);

  private base(releaseId: string, moduloId: string): string {
    return `${environment.releaseOrchestratorApiUrl}/releases/${releaseId}/modulos/${moduloId}/artefatos`;
  }

  listar(releaseId: string, moduloId: string): Observable<ArtefatoReleaseModulo[]> {
    return this.http.get<ArtefatoReleaseModulo[]>(this.base(releaseId, moduloId));
  }

  upload(releaseId: string, moduloId: string, file: File, observacao?: string)
    : Observable<ArtefatoReleaseModulo> {
    const form = new FormData();
    form.append('file', file);
    if (observacao) {
      form.append('observacao', observacao);
    }
    return this.http.post<ArtefatoReleaseModulo>(this.base(releaseId, moduloId), form);
  }

  /** Devolve a URL absoluta de download (auth header é incluído pelo interceptor). */
  downloadUrl(releaseId: string, moduloId: string, id: string): string {
    return `${this.base(releaseId, moduloId)}/${id}/download`;
  }

  baixar(releaseId: string, moduloId: string, id: string): Observable<Blob> {
    return this.http.get(this.downloadUrl(releaseId, moduloId, id), { responseType: 'blob' });
  }

  excluir(releaseId: string, moduloId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(releaseId, moduloId)}/${id}`);
  }
}
