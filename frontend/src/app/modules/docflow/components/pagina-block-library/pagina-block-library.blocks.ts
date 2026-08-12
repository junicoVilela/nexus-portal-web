export type CategoriaBlocoPagina = 'Estrutura' | 'Orientação' | 'Referência' | 'Navegação' | 'Kits';

export type ParametrizacaoBlocoPagina = 'acoes-tela' | 'mensagens-sistema' | 'campos-criticos';

export interface SlotBlocoPagina {
  id: string;
  elemento: string;
  classeCss: string;
  textoPadrao: string;
}

/**
 * Contrato do catálogo canônico servido pelo backend.
 * O frontend não mantém mais uma cópia dos componentes e do HTML.
 */
export interface BlocoPagina {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaBlocoPagina;
  visual: string;
  html: string;
  parametrizacao?: ParametrizacaoBlocoPagina;
  versao?: number;
  slots?: SlotBlocoPagina[];
}
