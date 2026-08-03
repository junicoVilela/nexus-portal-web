import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { EscopoAcesso, EscopoAcessoForm, TipoAmbiente } from '../models/escopo-acesso.model';

interface BackendEscopoAcessoResponse {
  id: string;
  usuarioId: string | null;
  grupoAcessoId: string | null;
  clienteId: string | null;
  ambienteId: string | null;
  produtoId: string | null;
  tipoAmbiente: TipoAmbiente | null;
  somenteLeitura: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
}

@Injectable({ providedIn: 'root' })
export class EscopoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.rbacApiUrl}/escopos`;

  listarPorUsuario(usuarioId: string): Observable<EscopoAcesso[]> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.get<BackendEscopoAcessoResponse[]>(this.base, { params })
      .pipe(map(list => list.map(e => this.mapear(e))));
  }

  listarPorGrupo(grupoAcessoId: string): Observable<EscopoAcesso[]> {
    const params = new HttpParams().set('grupoId', grupoAcessoId);
    return this.http.get<BackendEscopoAcessoResponse[]>(this.base, { params })
      .pipe(map(list => list.map(e => this.mapear(e))));
  }

  listarTodos(): Observable<EscopoAcesso[]> {
    return this.http.get<BackendEscopoAcessoResponse[]>(this.base)
      .pipe(map(list => list.map(e => this.mapear(e))));
  }

  criar(form: EscopoAcessoForm): Observable<EscopoAcesso> {
    return this.http.post<BackendEscopoAcessoResponse>(this.base, this.payload(form))
      .pipe(map(e => this.mapear(e)));
  }

  atualizar(id: string, form: EscopoAcessoForm): Observable<EscopoAcesso> {
    return this.http.put<BackendEscopoAcessoResponse>(`${this.base}/${id}`, this.payload(form))
      .pipe(map(e => this.mapear(e)));
  }

  alterarStatus(id: string, ativo: boolean): Observable<EscopoAcesso> {
    const params = new HttpParams().set('ativo', String(ativo));
    return this.http.patch<BackendEscopoAcessoResponse>(`${this.base}/${id}/status`, null, { params })
      .pipe(map(e => this.mapear(e)));
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  private payload(form: EscopoAcessoForm) {
    return {
      usuarioId: form.usuarioId ?? null,
      grupoAcessoId: form.grupoAcessoId ?? null,
      clienteId: form.clienteId ?? null,
      ambienteId: form.ambienteId ?? null,
      produtoId: form.produtoId ?? null,
      tipoAmbiente: form.tipoAmbiente ?? null,
      somenteLeitura: form.somenteLeitura,
      ativo: form.ativo,
    };
  }

  private mapear(src: BackendEscopoAcessoResponse): EscopoAcesso {
    return {
      id: src.id,
      usuarioId: src.usuarioId,
      grupoAcessoId: src.grupoAcessoId,
      clienteId: src.clienteId,
      ambienteId: src.ambienteId,
      produtoId: src.produtoId,
      tipoAmbiente: src.tipoAmbiente,
      somenteLeitura: src.somenteLeitura,
      ativo: src.ativo,
      criadoEm: src.criadoEm,
      atualizadoEm: src.atualizadoEm,
    };
  }
}
