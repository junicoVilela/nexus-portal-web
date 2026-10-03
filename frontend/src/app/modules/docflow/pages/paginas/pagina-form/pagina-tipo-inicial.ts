/** Tipos de página que a lista oferece ao criar (`?tipoPagina=`), cada um com um kit de blocos. */
export type TipoPaginaInicial = 'lista' | 'incluir' | 'editar' | 'indice' | 'menu';

export interface EstruturaTipoPagina {
  titulo: string;
  codigo: string;
  resumo: string;
  /** Id do kit no catálogo de blocos (`BlocoPagina`). */
  kitId: string;
}

/** Sugestões iniciais por tipo; o editor só preenche os campos que estiverem vazios. */
export const ESTRUTURA_TIPO_PAGINA: Record<TipoPaginaInicial, EstruturaTipoPagina> = {
  lista: {
    titulo: 'Lista de registros',
    codigo: 'LISTA-001',
    resumo: 'Consulta e listagem de registros com filtros, grade de resultados e ações da tela.',
    kitId: 'kit-lista',
  },
  incluir: {
    titulo: 'Incluir registro',
    codigo: 'INCLUIR-001',
    resumo: 'Formulário para inclusão de novos registros com campos obrigatórios e validações.',
    kitId: 'kit-incluir',
  },
  editar: {
    titulo: 'Editar registro',
    codigo: 'EDITAR-001',
    resumo: 'Formulário para alteração de registros existentes com campos editáveis e validações.',
    kitId: 'kit-editar',
  },
  indice: {
    titulo: 'Operações',
    codigo: 'OPS-001',
    resumo: 'Índice das operações disponíveis neste módulo com links aos guias filhos.',
    kitId: 'kit-indice',
  },
  menu: {
    titulo: 'Menu',
    codigo: 'MENU-001',
    resumo: 'Pasta de navegação com links para as subpáginas desta seção.',
    kitId: 'kit-menu',
  },
};

export function estruturaTipoPagina(tipo: string | null): EstruturaTipoPagina | null {
  return tipo && Object.hasOwn(ESTRUTURA_TIPO_PAGINA, tipo)
    ? ESTRUTURA_TIPO_PAGINA[tipo as TipoPaginaInicial]
    : null;
}
