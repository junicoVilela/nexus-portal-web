export type TipoModulo = 'WEB' | 'BATCH' | 'BANCO' | 'KETTLE' | 'FUNCIONALIDADES' | 'REGRAS';

export interface ModuloProduto {
  id: string;
  produtoId: string;
  codigo: string;
  nome: string;
  tipo: TipoModulo;
  geraDelta: boolean;
  obrigatorio: boolean;
  ordem: number;
  ativo: boolean;
  configEspecifica?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Body do POST. `codigo` e `tipo` são imutáveis após criação. */
export interface CriarModuloProdutoForm {
  nome: string;
  codigo: string;
  tipo: TipoModulo;
  geraDelta?: boolean | null;
  obrigatorio?: boolean | null;
  ordem?: number | null;
  configEspecifica?: string;
}

/** Body do PUT. Não inclui `codigo` nem `tipo`. */
export interface AtualizarModuloProdutoForm {
  nome: string;
  geraDelta: boolean;
  obrigatorio: boolean;
  configEspecifica?: string;
}

/** Defaults exibidos no form de criação quando o usuário não preenche. */
export const TIPO_MODULO_DEFAULTS: Record<TipoModulo, { geraDelta: boolean; obrigatorio: boolean }> = {
  WEB: { geraDelta: false, obrigatorio: true },
  BATCH: { geraDelta: false, obrigatorio: true },
  BANCO: { geraDelta: true, obrigatorio: true },
  KETTLE: { geraDelta: true, obrigatorio: false },
  FUNCIONALIDADES: { geraDelta: false, obrigatorio: true },
  REGRAS: { geraDelta: false, obrigatorio: true },
};

/** Extensões default aceitas no upload por tipo (spec 10 §3). */
export const TIPO_MODULO_EXTENSOES: Record<TipoModulo, string[]> = {
  WEB: ['.war', '.jar', '.zip', '.tar.gz', '.tgz', '.ear'],
  BATCH: ['.jar', '.zip', '.tar.gz', '.tgz'],
  BANCO: ['.sql', '.zip'],
  KETTLE: ['.ktr', '.kjb', '.zip'],
  FUNCIONALIDADES: [],
  REGRAS: [],
};

export function tipoModuloAceitaUpload(tipo: TipoModulo): boolean {
  return tipo !== 'FUNCIONALIDADES' && tipo !== 'REGRAS';
}
