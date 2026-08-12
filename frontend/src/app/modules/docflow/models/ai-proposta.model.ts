export interface AiQualidadeItem {
  codigo: string;
  titulo: string;
  descricao: string;
  ok: boolean;
  severidade: string;
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
