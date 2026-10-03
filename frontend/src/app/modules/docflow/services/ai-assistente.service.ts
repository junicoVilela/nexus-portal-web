import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import {
  AiConfirmarEstruturaDocumentoPayload,
  AiAtualizarComposicaoDocumentoPayload,
  AiDocumentoImportacao,
  AiEstimativaLoteDocumento,
  AiReordenarEstruturaDocumentoPayload,
  AiImportacaoResumo,
} from '../models/ai-documento-importacao.model';
import { AiJobEvento } from '../models/ai-evento.model';
import { AiMensagemPayload, AiSessao, CriarAiSessaoPayload } from '../models/ai-sessao.model';
import {
  AiAjustePaginaPayload,
  AiAjustePaginaResposta,
  AiAplicacao,
  AiJob,
  AiProposta,
  AiRejeicao,
} from '../models/ai-proposta.model';
import { AiMetricas } from '../models/ai-metricas.model';
import { AiStatus } from '../models/ai-status.model';
import {
  AiTemplateRecomendacao,
  AiTemplateRecomendacaoPayload,
} from '../models/ai-template-recomendacao.model';

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

  recomendarTemplate(payload: AiTemplateRecomendacaoPayload): Observable<AiTemplateRecomendacao> {
    return this.http.post<AiTemplateRecomendacao>(`${this.base}/templates/recomendacao`, payload);
  }

  importarDocumento(
    arquivo: File,
    contexto?: { projetoId?: string | null; clienteId?: string | null; novaImportacao?: boolean },
  ): Observable<AiDocumentoImportacao> {
    const formData = new FormData();
    formData.append('arquivo', arquivo, arquivo.name);
    const params: Record<string, string> = {};
    if (contexto?.projetoId) params['projetoId'] = contexto.projetoId;
    if (contexto?.clienteId) params['clienteId'] = contexto.clienteId;
    if (contexto?.novaImportacao) params['novaImportacao'] = 'true';
    return this.http.post<AiDocumentoImportacao>(`${this.base}/importacoes`, formData, { params });
  }

  /** Importações não concluídas do usuário (mais recentes primeiro). */
  importacoesEmAndamento(): Observable<AiImportacaoResumo[]> {
    return this.http.get<AiImportacaoResumo[]>(`${this.base}/importacoes`);
  }

  buscarImportacao(id: string): Observable<AiDocumentoImportacao> {
    return this.http.get<AiDocumentoImportacao>(`${this.base}/importacoes/${id}`);
  }

  aceitarSugestaoImportacao(importacaoId: string, sugestaoId: string): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/sugestoes/${sugestaoId}/aceitar`,
      {},
    );
  }

  ignorarSugestaoImportacao(importacaoId: string, sugestaoId: string): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/sugestoes/${sugestaoId}/ignorar`,
      {},
    );
  }

  aplicarSugestoesSegurasImportacao(importacaoId: string): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/sugestoes/aplicar-seguras`,
      {},
    );
  }

  reordenarEstruturaImportada(
    importacaoId: string,
    payload: AiReordenarEstruturaDocumentoPayload,
  ): Observable<AiDocumentoImportacao> {
    return this.http.put<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/estrutura/rascunho`,
      payload,
    );
  }

  atualizarComposicaoImportada(
    importacaoId: string,
    paginaId: string,
    payload: AiAtualizarComposicaoDocumentoPayload,
  ): Observable<AiDocumentoImportacao> {
    return this.http.put<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/paginas/${paginaId}/composicao`,
      payload,
    );
  }

  confirmarEstruturaImportada(
    importacaoId: string,
    payload: AiConfirmarEstruturaDocumentoPayload,
  ): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/estrutura/confirmar`,
      payload,
    );
  }

  selecionarPaginaImportada(importacaoId: string, paginaId: string): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/paginas/${paginaId}/selecionar`,
      {},
    );
  }

  vincularPaginaImportada(
    importacaoId: string,
    paginaPlanoId: string,
    paginaId: string,
  ): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/paginas/${paginaPlanoId}/vincular/${paginaId}`,
      {},
    );
  }

  aceitarPaginaImportada(importacaoId: string, paginaPlanoId: string): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(
      `${this.base}/importacoes/${importacaoId}/paginas/${paginaPlanoId}/aceitar`,
      {},
    );
  }

  sincronizarImportacao(importacaoId: string): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(`${this.base}/importacoes/${importacaoId}/sincronizar`, {});
  }

  estimarLoteImportacao(importacaoId: string, paginas: string[]): Observable<AiEstimativaLoteDocumento> {
    return this.http.post<AiEstimativaLoteDocumento>(
      `${this.base}/importacoes/${importacaoId}/lote/estimar`,
      {
        paginas,
      },
    );
  }

  gerarLoteImportacao(importacaoId: string, paginas: string[]): Observable<AiDocumentoImportacao> {
    return this.http.post<AiDocumentoImportacao>(`${this.base}/importacoes/${importacaoId}/lote/gerar`, {
      paginas,
    });
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

  /** `instrucao` opcional: ajuste pedido pelo autor sobre a proposta anterior. */
  gerar(id: string, instrucao?: string | null): Observable<AiJob> {
    const texto = instrucao?.trim();
    return this.http.post<AiJob>(`${this.base}/sessoes/${id}/gerar`, texto ? { instrucao: texto } : {});
  }

  /** Painel de qualidade da IA: aceite por versão de prompt, avisos, rejeições, custo. */
  metricas(dias: number): Observable<AiMetricas> {
    return this.http.get<AiMetricas>(`${this.base}/metricas`, { params: { dias } });
  }

  /** Ajuste de página existente (Fase B): cria a sessão sobre a versão aberta no editor. */
  pedirAjuste(paginaId: string, payload: AiAjustePaginaPayload): Observable<AiAjustePaginaResposta> {
    return this.http.post<AiAjustePaginaResposta>(`${this.base}/paginas/${paginaId}/ajustes`, payload);
  }

  /** A página criada a partir da proposta foi salva: a API marca a proposta como aceita. */
  vincularPagina(sessaoId: string, paginaId: string): Observable<AiProposta> {
    return this.http.post<AiProposta>(`${this.base}/sessoes/${sessaoId}/pagina`, { paginaId });
  }

  rejeitarProposta(id: string, rejeicao: AiRejeicao): Observable<AiProposta> {
    const motivo = rejeicao.motivo?.trim();
    return this.http.post<AiProposta>(`${this.base}/sessoes/${id}/proposta/rejeitar`, {
      ...(rejeicao.categoria ? { categoria: rejeicao.categoria } : {}),
      ...(motivo ? { motivo } : {}),
    });
  }

  proposta(id: string): Observable<AiProposta> {
    return this.http.get<AiProposta>(`${this.base}/sessoes/${id}/proposta`);
  }

  aplicar(
    id: string,
    payload: {
      modo: 'FORM' | 'PERSISTIR';
      moduloId?: string | null;
      parentId?: string | null;
      ordem?: number | null;
      /** Ajuste de página: ids das mudanças aceitas. */
      operacoesAceitas?: string[];
    },
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
