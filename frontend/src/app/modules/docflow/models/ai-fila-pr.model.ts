import { AiProposta } from './ai-proposta.model';
import { AiSessaoStatus } from './ai-sessao.model';

export type AiPrClassificacao = 'UI_NOVA' | 'UI_ALTERACAO' | 'SO_BACKEND' | 'IRRELEVANTE';
export type AiPrEventoStatus = 'RECEBIDO' | 'IGNORADO' | 'AGUARDANDO_RASCUNHO' | 'EM_FILA' | 'ERRO';

/** Item da fila de propostas vindas de PR (`GET /ai/fila-pr`). */
export interface AiFilaPrItem {
  id: string;
  repositorio: string;
  numeroPr: number;
  titulo: string;
  url: string;
  autor: string | null;
  branchBase: string;
  mergedAt: string | null;
  classificacao: AiPrClassificacao | null;
  codigoTela: string | null;
  status: AiPrEventoStatus;
  mensagem: string | null;
  sessaoId: string | null;
  sessaoStatus: AiSessaoStatus | null;
  /** Página existente que o PR altera; nula = página nova. */
  paginaId: string | null;
  responsavel: string | null;
  createdAt: string;
  proposta: AiProposta | null;
  /** Precisa de alguém: proposta aguardando decisão, aguardando rascunho ou erro. */
  pendente: boolean;
}
