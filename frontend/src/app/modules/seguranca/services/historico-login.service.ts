import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult } from '@shared/models/page-result.model';
import { HistoricoLogin } from '../models/historico-login.model';
import { MockStore } from './mock/mock-store.service';
import { paginar, simularRequisicao } from './mock/in-memory-store';

export interface HistoricoLoginFilter {
  usuarioId?: string;
  /** Busca textual no login informado. */
  q?: string;
  /** true = só sucessos, false = só falhas, undefined = todos. */
  sucesso?: boolean;
  /** ISO date (yyyy-mm-dd) inclusive. */
  inicio?: string;
  /** ISO date (yyyy-mm-dd) inclusive. */
  fim?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class HistoricoLoginService {
  private readonly store = inject(MockStore);

  listar(filter: HistoricoLoginFilter = {}): Observable<PageResult<HistoricoLogin>> {
    let lista = this.store.historicoLogin();
    if (filter.usuarioId) lista = lista.filter(h => h.usuarioId === filter.usuarioId);
    if (filter.sucesso !== undefined) lista = lista.filter(h => h.sucesso === filter.sucesso);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      lista = lista.filter(h => h.loginInformado.toLowerCase().includes(q));
    }
    if (filter.inicio) {
      const inicio = new Date(filter.inicio + 'T00:00:00').getTime();
      lista = lista.filter(h => new Date(h.criadoEm).getTime() >= inicio);
    }
    if (filter.fim) {
      const fim = new Date(filter.fim + 'T23:59:59').getTime();
      lista = lista.filter(h => new Date(h.criadoEm).getTime() <= fim);
    }
    // Já chega ordenado desc (registro mais recente no topo).
    return simularRequisicao(paginar(lista, { page: filter.page ?? 1, size: filter.size ?? 20 }));
  }
}
