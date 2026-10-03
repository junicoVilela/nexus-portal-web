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
  rejeicoesRecentes: { categoria: string | null; motivo: string | null; promptVersao: string; em: string }[];
  /** Todas as categorias, inclusive zeradas, na ordem do backend. */
  rejeicoesPorCategoria: { categoria: string; rotulo: string; total: number }[];
  /** Páginas novas aceitas: quantas tiveram cada campo mudado pelo autor depois. */
  alteracoesPosAceite: {
    amostras: number;
    tituloAlterado: number;
    resumoAlterado: number;
    codigoTelaAlterado: number;
    /** Menos da metade do texto da IA continua na página. */
    conteudoReescrito: number;
  };
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
  /** Média do texto da IA que continua nas páginas salvas (0–1); nula sem amostra. */
  textoMantido: number | null;
  amostrasTextoMantido: number;
  /** Rejeições por categoria nesta versão (só as que ocorreram). */
  rejeicoesPorCategoria: Partial<Record<string, number>>;
}
