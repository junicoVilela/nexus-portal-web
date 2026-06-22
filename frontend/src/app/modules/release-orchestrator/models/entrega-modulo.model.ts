export type TipoModulo =
  | 'WEB'
  | 'BATCH'
  | 'BANCO'
  | 'KETTLE'
  | 'FUNCIONALIDADES'
  | 'REGRAS';

export interface EntregaModulo {
  id: string;
  entregaId: string;
  moduloProdutoId: string;
  moduloCodigo: string;
  moduloNome: string;
  moduloTipo: TipoModulo;
  versaoFrom?: string;
  versaoTo?: string;
  selecionado: boolean;
  foraContrato: boolean;
  mudancaDetectada: boolean;
  ordem: number;
}

export interface EntregaModuloArtefato {
  id: string;
  entregaModuloId: string;
  moduloProdutoId: string;
  moduloCodigo: string;
  moduloNome: string;
  moduloTipo: TipoModulo;
  artefatoId: string;
  nomeArquivo: string;
  sha256: string;
  tamanhoBytes: number;
  ordem: number;
}

export interface DeltaResumoModulo {
  moduloProdutoId: string;
  codigo: string;
  nome: string;
  tipo: TipoModulo;
  versaoFrom?: string;
  versaoTo?: string;
  quantidadeArtefatos: number;
  tamanhoBytes: number;
}

export interface DeltaResumo {
  entregaId: string;
  totalArtefatos: number;
  totalTamanhoBytes: number;
  modulos: DeltaResumoModulo[];
}

export const TIPO_MODULO_LABELS: Record<TipoModulo, string> = {
  WEB: 'Web',
  BATCH: 'Batch',
  BANCO: 'Banco',
  KETTLE: 'Kettle',
  FUNCIONALIDADES: 'Funcionalidades',
  REGRAS: 'Regras',
};

export const TIPO_MODULO_TONES: Record<TipoModulo, 'neutral' | 'success' | 'info' | 'warn' | 'danger'> = {
  WEB: 'info',
  BATCH: 'info',
  BANCO: 'warn',
  KETTLE: 'warn',
  FUNCIONALIDADES: 'neutral',
  REGRAS: 'neutral',
};

export interface CalcularDeltaForm {
  modulos?: {
    moduloProdutoId: string;
    fromTag?: string;
    justificativa?: string;
  }[];
}
