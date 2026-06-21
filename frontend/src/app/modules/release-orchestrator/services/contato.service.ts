import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { Contato, ContatoForm } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ContatoService {
  private readonly http = inject(HttpClient);

  private base(clienteId: string): string {
    return `${environment.releaseOrchestratorApiUrl}/clientes/${clienteId}/contatos`;
  }

  listar(clienteId: string): Observable<Contato[]> {
    return this.http.get<Contato[]>(this.base(clienteId));
  }

  buscar(clienteId: string, id: string): Observable<Contato> {
    return this.http.get<Contato>(`${this.base(clienteId)}/${id}`);
  }

  criar(clienteId: string, form: ContatoForm): Observable<Contato> {
    return this.http.post<Contato>(this.base(clienteId), form);
  }

  atualizar(clienteId: string, id: string, form: ContatoForm): Observable<Contato> {
    return this.http.put<Contato>(`${this.base(clienteId)}/${id}`, form);
  }

  excluir(clienteId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base(clienteId)}/${id}`);
  }
}
