import { StatusPagina } from './pagina.model';

export interface DocFlowDashboardResumo {
  totalClientes: number;
  totalProjetos: number;
  totalModulos: number;
  totalPaginas: number;
  totalPublicacoes: number;
  paginasPendentes: number;
  paginasEmRevisao: number;
  publicacoesGerando: number;
  publicacoesComErro: number;
  clientesSemPublicacao: number;
  paginasSemResumo: number;
  paginasDesatualizadas: number;
  taxaSucessoPublicacoes: number;
  paginasPorStatus: Partial<Record<StatusPagina, number>>;
  /** INT-302: telas alteradas por release depois da última publicação. */
  paginasDesatualizadasPorRelease: number;
  /** INT-606: buscas no manual hospedado nos últimos 30 dias. */
  lacunas: {
    buscas: number;
    buscasSemResultado: number;
    termosSemResultado: { termo: string; ocorrencias: number }[];
  };
}
