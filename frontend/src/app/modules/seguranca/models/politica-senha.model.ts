export interface PoliticaSenha {
  id: string;
  tamanhoMinimo: number;
  exigirMaiuscula: boolean;
  exigirMinuscula: boolean;
  exigirNumero: boolean;
  exigirEspecial: boolean;
  /** Em dias. null = não expira. */
  expiraSenhaDias: number | null;
  /** Quantas senhas anteriores não podem ser reusadas. */
  quantidadeHistorico: number;
  maxTentativasInvalidas: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
}

export interface PoliticaSenhaForm {
  tamanhoMinimo: number;
  exigirMaiuscula: boolean;
  exigirMinuscula: boolean;
  exigirNumero: boolean;
  exigirEspecial: boolean;
  expiraSenhaDias: number | null;
  quantidadeHistorico: number;
  maxTentativasInvalidas: number;
}

/** Resultado da validação de uma senha contra a política. */
export interface ResultadoValidacaoSenha {
  valido: boolean;
  /** Lista de violações em linguagem natural. Vazia se válido. */
  violacoes: string[];
}
