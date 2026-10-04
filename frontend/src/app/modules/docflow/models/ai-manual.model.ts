/** Resposta do manual publicado (`POST /ai/publicacoes/{id}/perguntar`, Onda E). */
export interface AiManualResposta {
  manual: string;
  versao: string;
  /** IA: texto gerado com citação; TRECHOS: só os trechos (IA off/falhou); NAO_SEI: o manual não cobre. */
  modo: 'IA' | 'TRECHOS' | 'NAO_SEI';
  resposta: string;
  citacoes: AiManualCitacao[];
}

export interface AiManualCitacao {
  codigoTela: string;
  titulo: string;
  secao: string | null;
  caminho: string;
  url: string | null;
  trecho: string;
}
