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
}
