export type CategoriaItem =
  | 'NOVIDADE'
  | 'MELHORIA'
  | 'CORRECAO'
  | 'SEGURANCA'
  | 'PERFORMANCE'
  | 'DOCUMENTACAO'
  | 'AJUSTE_TECNICO'
  | 'IMPACTO_OPERACIONAL'
  | 'IMPORTANTE';

/** Visibilidade interna — quem na equipe pode ver o item */
export type VisibilidadeItem = 'TODOS' | 'TECNICO' | 'SUPORTE';

export interface ReleaseItem {
  id: string;
  releaseId: string;
  categoria: CategoriaItem;
  titulo: string;
  descricao?: string;
  visibilidade: VisibilidadeItem;
  ordem: number;
  ticket?: string;
  commit?: string;
  pullRequest?: string;
  responsavelId?: string;
  responsavel?: string;
  createdAt?: string;
}

export interface ReleaseItemForm {
  categoria: CategoriaItem;
  titulo: string;
  descricao?: string;
  visibilidade: VisibilidadeItem;
  ordem?: number;
  ticket?: string;
  commit?: string;
  pullRequest?: string;
}

export const CATEGORIA_LABELS: Record<CategoriaItem, string> = {
  NOVIDADE: 'Novidade',
  MELHORIA: 'Melhoria',
  CORRECAO: 'Correção',
  SEGURANCA: 'Segurança',
  PERFORMANCE: 'Performance',
  DOCUMENTACAO: 'Documentação',
  AJUSTE_TECNICO: 'Ajuste técnico',
  IMPACTO_OPERACIONAL: 'Impacto operacional',
  IMPORTANTE: 'Importante',
};

export const CATEGORIA_ICONES: Record<CategoriaItem, string> = {
  NOVIDADE: 'pi-star',
  MELHORIA: 'pi-arrow-up-right',
  CORRECAO: 'pi-wrench',
  SEGURANCA: 'pi-shield',
  PERFORMANCE: 'pi-bolt',
  DOCUMENTACAO: 'pi-file-edit',
  AJUSTE_TECNICO: 'pi-code',
  IMPACTO_OPERACIONAL: 'pi-exclamation-triangle',
  IMPORTANTE: 'pi-info-circle',
};

export const CATEGORIA_CORES: Record<CategoriaItem, string> = {
  NOVIDADE: 'blue',
  MELHORIA: 'green',
  CORRECAO: 'orange',
  SEGURANCA: 'purple',
  PERFORMANCE: 'cyan',
  DOCUMENTACAO: 'slate',
  AJUSTE_TECNICO: 'violet',
  IMPACTO_OPERACIONAL: 'red',
  IMPORTANTE: 'amber',
};

export const VISIBILIDADE_ITEM_LABELS: Record<VisibilidadeItem, string> = {
  TODOS: 'Todos',
  TECNICO: 'Técnico',
  SUPORTE: 'Suporte',
};

export const CATEGORIAS_ORDENADAS: CategoriaItem[] = [
  'NOVIDADE',
  'MELHORIA',
  'CORRECAO',
  'SEGURANCA',
  'PERFORMANCE',
  'DOCUMENTACAO',
  'AJUSTE_TECNICO',
  'IMPACTO_OPERACIONAL',
  'IMPORTANTE',
];
