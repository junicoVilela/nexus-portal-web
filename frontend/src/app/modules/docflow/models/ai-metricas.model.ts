/** Painel de qualidade da IA (`GET /ai/metricas`). Taxas em 0–1; nulas sem amostra. */
export interface AiMetricas {
  periodoDias: number;
  desde: string;
  geracao: {
    jobs: number;
    sucesso: number;
    erro: number;
    cancelados: number;
    latenciaP50Ms: number | null;
    latenciaP90Ms: number | null;
    tokensEntrada: number;
    tokensSaida: number;
  };
  porPrompt: AiMetricasPrompt[];
  ajustes: {
    aplicados: number;
    operacoesPropostas: number;
    operacoesAceitas: number;
    taxaAceiteOperacoes: number | null;
    porTipo: { tipo: string; propostas: number; aceitas: number }[];
  };
  avisosFrequentes: { aviso: string; ocorrencias: number }[];
  rejeicoesRecentes: { motivo: string; promptVersao: string; em: string }[];
}

export interface AiMetricasPrompt {
  promptVersao: string;
  propostas: number;
  aceitas: number;
  rejeitadas: number;
  regeneradas: number;
  pendentes: number;
  comAvisos: number;
  taxaAceite: number | null;
}
