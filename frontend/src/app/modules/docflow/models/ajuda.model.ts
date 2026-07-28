export type TipoAjudaConteudo = 'JORNADA' | 'ETAPA' | 'FAQ' | 'ARTIGO' | 'TOUR_PASSO' | 'ONBOARDING';
export type TipoAjudaMedia = 'NENHUMA' | 'IMAGEM' | 'GIF' | 'VIDEO' | 'GALERIA';
export type TipoAjudaEvento =
  | 'BUSCA'
  | 'BUSCA_SEM_RESULTADO'
  | 'CONTEUDO_ABERTO'
  | 'ETAPA_CONCLUIDA'
  | 'TOUR_INICIADO'
  | 'TOUR_CONCLUIDO'
  | 'TOUR_ABANDONADO'
  | 'ONBOARDING_CONCLUIDO';

export interface AjudaConteudo {
  id?: string;
  codigo: string;
  tipo: TipoAjudaConteudo;
  jornadaCodigo?: string | null;
  titulo: string;
  resumo?: string | null;
  conteudo?: string | null;
  rotaContexto?: string | null;
  rotaAcao?: string | null;
  rotuloAcao?: string | null;
  icone?: string | null;
  seletorAlvo?: string | null;
  mediaTipo: TipoAjudaMedia;
  mediaUrls: string[];
  mediaAlt?: string | null;
  ordem: number;
  ativo: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type AjudaConteudoRequest = Omit<AjudaConteudo, 'id' | 'updatedAt' | 'updatedBy'>;

export interface AjudaEventoRequest {
  tipo: TipoAjudaEvento;
  conteudoCodigo?: string;
  termo?: string;
  rota?: string;
  sessaoId?: string;
  resultadoQuantidade?: number;
}

export interface AjudaMetricaItem {
  chave: string;
  rotulo: string;
  total: number;
}

export interface AjudaMetricas {
  desde: string;
  totalEventos: number;
  buscas: number;
  buscasSemResultado: number;
  toursIniciados: number;
  toursConcluidos: number;
  taxaConclusaoTour: number;
  conteudosMaisAcessados: AjudaMetricaItem[];
  buscasFrequentes: AjudaMetricaItem[];
}

export interface AjudaEtapaView {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  conteudo?: string;
  acao: string;
  rota: string;
  mediaTipo: TipoAjudaMedia;
  mediaUrls: string[];
  mediaAlt?: string;
}

export interface AjudaJornadaView {
  id: string;
  codigo: string;
  ordem: string;
  titulo: string;
  descricao: string;
  conteudo?: string;
  icon: string;
  tempo: string;
  mediaTipo: TipoAjudaMedia;
  mediaUrls: string[];
  mediaAlt?: string;
  etapas: AjudaEtapaView[];
}

export interface AjudaFaqView {
  id: string;
  codigo: string;
  pergunta: string;
  resposta: string;
}
