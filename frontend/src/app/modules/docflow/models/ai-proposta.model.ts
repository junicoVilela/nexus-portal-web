export interface AiQualidadeItem {
  codigo: string;
  titulo: string;
  descricao: string;
  ok: boolean;
  severidade: string;
}

/** Mudança proposta no ajuste de página (Fase B). */
export interface AiPatchOperacao {
  id: string;
  tipo: 'ALTERAR_TEXTO' | 'INSERIR_BLOCO' | 'REMOVER_UNIDADE';
  unidadeId: string | null;
  textoAntes: string | null;
  novoTexto: string | null;
  aposSecaoId: string | null;
  componenteId: string | null;
  textos: Record<string, string>;
  motivo: string | null;
}

export interface AiProposta {
  id: string;
  sessaoId: string;
  jobId: string;
  tipo: 'NOVA' | 'ATUALIZACAO';
  titulo: string;
  slug: string;
  codigoTela: string;
  resumo: string | null;
  conteudoHtml: string;
  templateId: string | null;
  templateVersao: number | null;
  pageSpecJson?: string | null;
  aptoParaRevisao: boolean;
  qualidade: AiQualidadeItem[];
  status: 'PENDENTE' | 'ACEITA' | 'REJEITADA' | 'DESCARTADA';
  paginaId: string | null;
  createdAt: string;
  /** Não vazio quando a geração caiu em fallback; o conteúdo exige revisão redobrada. */
  avisosGeracao?: string[];
  motivoRejeicao?: string | null;
  /** Ajuste de página: resumo da IA, mudanças propostas e as que o autor aplicou. */
  resumoDaMudanca?: string | null;
  operacoes?: AiPatchOperacao[];
  operacoesAceitas?: string[];
}

export interface AiAjustePaginaPayload {
  instrucao: string;
  secaoId: string | null;
  version: number;
}

export interface AiAjustePaginaResposta {
  sessaoId: string;
  job: AiJob;
}

export interface AiPageSpecResumo {
  schemaVersion: number;
  blueprintId: string | null;
  blocos: { componenteId: string }[];
}

export interface AiJob {
  id: string;
  sessaoId: string;
  tipo: string;
  status: 'PENDENTE' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO' | 'CANCELADO';
  etapa:
    | 'AGUARDANDO'
    | 'PREPARANDO_CONTEXTO'
    | 'SELECIONANDO_ESTRUTURA'
    | 'GERANDO_CONTEUDO'
    | 'VALIDANDO_QUALIDADE'
    | 'FINALIZANDO'
    | 'CONCLUIDA'
    | 'CANCELADA'
    | 'FALHA';
  progresso: number;
  tentativa: number;
  erroMensagem: string | null;
  diagnosticoId: string | null;
  modelo: string | null;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  duracaoMs: number;
  startedAt: string | null;
  finishedAt: string | null;
  heartbeatAt: string | null;
  cancelRequestedAt: string | null;
}

export interface AiAplicacao {
  modo: 'FORM' | 'PERSISTIR';
  propostaId: string;
  paginaId: string | null;
  titulo: string;
  slug: string;
  codigoTela: string;
  resumo: string | null;
  conteudoHtml: string;
  templateOrigemId: string | null;
  templateOrigemVersao: number | null;
  moduloId: string | null;
}
