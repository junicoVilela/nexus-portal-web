import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';

export type TipoPdf = 'CLIENTE' | 'SUPORTE' | 'INTERNO';

@Injectable({ providedIn: 'root' })
export class ReleasePdfService {
  private readonly base = `${environment.releaseOrchestratorApiUrl}/releases`;

  constructor(private readonly http: HttpClient) {}

  gerar(releaseId: string, tipo: TipoPdf): Observable<Blob> {
    return this.http.get(`${this.base}/${releaseId}/pdf?tipo=${tipo}`, {
      responseType: 'blob',
    });
  }

  download(releaseId: string, tipo: TipoPdf, nomeArquivo: string): void {
    this.gerar(releaseId, tipo).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
