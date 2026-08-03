import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import { AiJobEvento } from '../models/ai-evento.model';
import {
  AiMensagemPayload,
  AiSessao,
  CriarAiSessaoPayload,
} from '../models/ai-sessao.model';
import { AiAplicacao, AiJob, AiProposta } from '../models/ai-proposta.model';
import { AiStatus } from '../models/ai-status.model';

/**
 * Cliente HTTP do módulo AI.
 * Base isolada em {@code environment.aiApiUrl} para facilitar apontar a um serviço externo.
 */
@Injectable({ providedIn: 'root' })
export class AiAssistenteService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.aiApiUrl;

  status(): Observable<AiStatus> {
    return this.http.get<AiStatus>(`${this.base}/status`);
  }

  criarSessao(payload: CriarAiSessaoPayload): Observable<AiSessao> {
    return this.http.post<AiSessao>(`${this.base}/sessoes`, payload);
  }

  buscarSessao(id: string): Observable<AiSessao> {
    return this.http.get<AiSessao>(`${this.base}/sessoes/${id}`);
  }

  enviarMensagem(id: string, payload: AiMensagemPayload): Observable<AiSessao> {
    return this.http.post<AiSessao>(`${this.base}/sessoes/${id}/mensagens`, payload);
  }

  cancelarSessao(id: string): Observable<AiSessao> {
    return this.http.post<AiSessao>(`${this.base}/sessoes/${id}/cancelar`, {});
  }

  gerar(id: string): Observable<AiJob> {
    return this.http.post<AiJob>(`${this.base}/sessoes/${id}/gerar`, {});
  }

  proposta(id: string): Observable<AiProposta> {
    return this.http.get<AiProposta>(`${this.base}/sessoes/${id}/proposta`);
  }

  aplicar(
    id: string,
    payload: { modo: 'FORM' | 'PERSISTIR'; moduloId?: string | null; parentId?: string | null },
  ): Observable<AiAplicacao> {
    return this.http.post<AiAplicacao>(`${this.base}/sessoes/${id}/aplicar`, payload);
  }

  /** SSE de jobs AI (`event: ai-job`). Fallback de polling fica no componente. */
  eventosAi(): Observable<AiJobEvento> {
    return new Observable(observer => {
      const controller = new AbortController();
      const token = localStorage.getItem('doc-flow-jwt');
      const authorization = token ? `Bearer ${token}` : null;
      void fetch(`${this.base}/eventos`, {
        signal: controller.signal,
        headers: authorization ? { Authorization: authorization } : {},
      })
        .then(async response => {
          if (!response.ok || !response.body) {
            throw new Error(`Stream AI indisponível (${response.status}).`);
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const eventos = buffer.split(/\r?\n\r?\n/);
            buffer = eventos.pop() ?? '';
            for (const evento of eventos) {
              const tipo = evento.match(/^event:\s*(.+)$/m)?.[1];
              const dados = evento.match(/^data:\s*(.+)$/m)?.[1];
              if (tipo === 'ai-job' && dados) {
                observer.next(JSON.parse(dados) as AiJobEvento);
              }
            }
          }
          if (!controller.signal.aborted) observer.complete();
        })
        .catch(error => {
          if (!controller.signal.aborted) observer.error(error);
        });
      return () => controller.abort();
    });
  }
}
