import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { ReleaseItem, ReleaseItemForm } from '../models/release-item.model';

@Injectable({ providedIn: 'root' })
export class ReleaseItemService {
  private readonly base = `${environment.releaseOrchestratorApiUrl}/releases`;

  constructor(private readonly http: HttpClient) {}

  listar(releaseId: string): Observable<ReleaseItem[]> {
    return this.http
      .get<ReleaseItem[]>(`${this.base}/${releaseId}/itens`)
      .pipe(map(r => (r ?? []).sort((a, b) => a.ordem - b.ordem)));
  }

  criar(releaseId: string, data: ReleaseItemForm): Observable<ReleaseItem> {
    return this.http.post<ReleaseItem>(`${this.base}/${releaseId}/itens`, data);
  }

  atualizar(releaseId: string, itemId: string, data: ReleaseItemForm): Observable<ReleaseItem> {
    return this.http.put<ReleaseItem>(`${this.base}/${releaseId}/itens/${itemId}`, data);
  }

  remover(releaseId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${releaseId}/itens/${itemId}`);
  }

  reordenar(releaseId: string, ordens: { id: string; ordem: number }[]): Observable<void> {
    return this.http.put<void>(`${this.base}/${releaseId}/itens/reordenar`, { ordens });
  }

  duplicar(releaseId: string, itemId: string): Observable<ReleaseItem> {
    return this.http.post<ReleaseItem>(`${this.base}/${releaseId}/itens/${itemId}/duplicar`, {});
  }
}
