export type OperacaoDeploy = 'CRIAR' | 'ATUALIZAR' | 'INICIAR' | 'PARAR';
export type ModoDeploy = 'DRY_RUN' | 'REAL';
export type StatusDeploy = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'FALHA' | 'IGNORADO';
export type TipoImplantacaoDeploy = 'DOCKER_PULL' | 'DOCKER_TAR' | 'LINUX_MANUAL' | 'WINDOWS_MANUAL';

export interface ManifestoImplantacao {
  releaseId: string;
  releaseVersao: string;
  tipoImplantacao: TipoImplantacaoDeploy;
  imagemRef?: string;
  arquivoImagemRef?: string;
  diretorioInstalacao?: string;
  observacoes?: string;
  resumo: string;
  derivado: boolean;
  fingerprint: string;
}

export interface DeployInstalacao {
  id: string;
  releaseId: string;
  releaseVersao: string;
  instalacaoId: string;
  instalacaoCodigo: string;
  instalacaoNome: string;
  hostCodigo: string;
  entregaId?: string;
  tipoImplantacao: TipoImplantacaoDeploy;
  operacao: OperacaoDeploy;
  modo: ModoDeploy;
  status: StatusDeploy;
  versaoOrigem?: string;
  versaoDestino: string;
  imagemRef?: string;
  arquivoImagemRef?: string;
  diretorioInstalacao?: string;
  fingerprint: string;
  mensagem?: string;
  erro?: string;
  operador?: string;
  reutilizado: boolean;
  iniciadoEm?: string;
  concluidoEm?: string;
  createdAt?: string;
}

export interface ExecutarDeployForm {
  releaseId: string;
  instalacaoId: string;
  entregaId?: string;
  forcar?: boolean;
  modo?: ModoDeploy;
}

export interface DeployLoteResultado {
  itens: DeployInstalacao[];
  concluidos: number;
  falhas: number;
  ignorados: number;
}

export const STATUS_DEPLOY_LABELS: Record<StatusDeploy, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  FALHA: 'Falha',
  IGNORADO: 'Já aplicado',
};

export const STATUS_DEPLOY_TONES: Record<StatusDeploy, 'neutral' | 'info' | 'success' | 'danger' | 'warn'> = {
  PENDENTE: 'neutral',
  EM_ANDAMENTO: 'info',
  CONCLUIDO: 'success',
  FALHA: 'danger',
  IGNORADO: 'warn',
};

export const OPERACAO_DEPLOY_LABELS: Record<OperacaoDeploy, string> = {
  CRIAR: 'Criar no host',
  ATUALIZAR: 'Atualizar',
  INICIAR: 'Iniciar',
  PARAR: 'Parar',
};
