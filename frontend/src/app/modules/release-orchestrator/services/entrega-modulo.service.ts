import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import {
  CalcularDeltaForm,
  DeltaResumo,
  EntregaModulo,
  EntregaModuloArtefato,
} from '../models/entrega-modulo.model';

@Injectable({ providedIn: 'root' })
export class EntregaModuloService {
  private readonly http = inject(HttpClient);

  private base(entregaId: string): string {
    return `${environment.releaseOrchestratorApiUrl}/entregas/${entregaId}`;
  }

  listarModulos(entregaId: string): Observable<EntregaModulo[]> {
    return this.http.get<EntregaModulo[]>(`${this.base(entregaId)}/modulos`);
  }

  inicializarModulos(entregaId: string): Observable<EntregaModulo[]> {
    return this.http.post<EntregaModulo[]>(`${this.base(entregaId)}/modulos/inicializar`, {});
  }

  alterarSelecao(
    entregaId: string,
    moduloProdutoId: string,
    selecionado: boolean,
  ): Observable<EntregaModulo> {
    return this.http.patch<EntregaModulo>(
      `${this.base(entregaId)}/modulos/${moduloProdutoId}/selecao`,
      { selecionado },
    );
  }

  listarDelta(entregaId: string): Observable<EntregaModuloArtefato[]> {
    return this.http.get<EntregaModuloArtefato[]>(`${this.base(entregaId)}/delta`);
  }

  resumoDelta(entregaId: string): Observable<DeltaResumo> {
    return this.http.get<DeltaResumo>(`${this.base(entregaId)}/delta/resumo`);
  }

  calcularDelta(entregaId: string, form: CalcularDeltaForm = {}): Observable<DeltaResumo> {
    return this.http.post<DeltaResumo>(`${this.base(entregaId)}/delta/calcular`, form);
  }

  baixarDocumento(entregaId: string): Observable<Blob> {
    return this.http.get(`${this.base(entregaId)}/documento`, { responseType: 'blob' });
  }
}
