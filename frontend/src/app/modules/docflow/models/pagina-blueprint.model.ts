export type NecessidadeSecaoBlueprint = 'OBRIGATORIA' | 'RECOMENDADA' | 'OPCIONAL';

export interface PaginaBlueprintSecao {
  slot: string;
  componenteId: string;
  necessidade: NecessidadeSecaoBlueprint;
  repetivel: boolean;
  maximoInstancias: number;
  alternativas: string[];
}

export interface PaginaBlueprint {
  id: string;
  nome: string;
  descricao: string;
  tipoConteudo: string;
  versao: number;
  status: string;
  minimoComponentes: number;
  maximoComponentes: number;
  templatesCompativeis: string[];
  secoes: PaginaBlueprintSecao[];
}
