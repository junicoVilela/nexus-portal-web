export type TipoImplantacao = 'DOCKER_PULL' | 'DOCKER_TAR' | 'LINUX_MANUAL' | 'WINDOWS_MANUAL';
export type StatusInstalacao = 'INEXISTENTE' | 'ATIVA' | 'INATIVA';
export type AmbienteInstalacao = 'PROD' | 'HOM' | 'DEV' | 'TEST';
export type TipoBancoInstalacao = 'ORACLE' | 'SQLSERVER' | 'POSTGRES';
export type TipoPorta = 'HTTP' | 'HTTPS' | 'AJP' | 'TOMCAT_SHUTDOWN' | 'DEBUG' | 'JMX' | 'BANCO' | 'OUTRO';
export type PapelPorta = 'BACKEND' | 'FRONTEND' | 'OUTRO';
export type ProtocoloPorta = 'TCP' | 'UDP';
export type StatusReservaPorta = 'DISPONIVEL' | 'RESERVADA' | 'EM_USO' | 'LIBERADA' | 'BLOQUEADA';
export type HealthInstalacao = 'DESCONHECIDO' | 'SAUDAVEL' | 'DEGRADADO' | 'INDISPONIVEL';

export interface ConfiguracaoInstalacao {
  id?: string;
  tipoBanco?: TipoBancoInstalacao;
  bancoHost?: string;
  bancoPorta?: number;
  bancoNome?: string;
  bancoUsuario?: string;
  bancoCredencialRef?: string;
  urlBackend?: string;
  urlFrontend?: string;
  parametros?: string;
}

export interface ReservaPorta {
  id?: string;
  tipo: TipoPorta;
  papel: PapelPorta;
  porta: number;
  protocolo: ProtocoloPorta;
  status: StatusReservaPorta;
}

export interface PortasSugeridas {
  backend: number[];
  frontend: number[];
  emUsoNoHost?: number[];
  verificouHost?: boolean;
}

export interface SugerirPortasOpts {
  backendInicio?: number;
  frontendInicio?: number;
  quantidade?: number;
}

export interface InstalacaoCliente {
  id: string;
  codigo: string;
  nome: string;
  clienteId: string;
  clienteNome: string;
  clienteSigla: string;
  hostId: string;
  hostCodigo: string;
  hostNome: string;
  produtoId: string;
  produtoNome: string;
  produtoSigla: string;
  tipoImplantacao: TipoImplantacao;
  status: StatusInstalacao;
  ambiente: AmbienteInstalacao;
  imagemRef?: string;
  arquivoImagemRef?: string;
  diretorioInstalacao?: string;
  observacoes?: string;
  versaoAtual?: string;
  health?: HealthInstalacao;
  ultimaVerificacao?: string;
  ultimoErro?: string;
  configuracao?: ConfiguracaoInstalacao | null;
  portas?: ReservaPorta[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InstalacaoClienteForm {
  codigo: string;
  nome: string;
  clienteId: string;
  hostId: string;
  produtoId: string;
  tipoImplantacao: TipoImplantacao;
  status?: StatusInstalacao;
  ambiente: AmbienteInstalacao;
  imagemRef?: string;
  arquivoImagemRef?: string;
  diretorioInstalacao?: string;
  observacoes?: string;
  versaoAtual?: string;
  configuracao?: ConfiguracaoInstalacao;
  portas?: ReservaPorta[];
}

export const TIPO_IMPLANTACAO_LABELS: Record<TipoImplantacao, string> = {
  DOCKER_PULL: 'Docker — baixar imagem',
  DOCKER_TAR: 'Docker — imagem .tar',
  LINUX_MANUAL: 'Linux manual (sem Docker)',
  WINDOWS_MANUAL: 'Windows manual',
};

export const STATUS_INSTALACAO_LABELS: Record<StatusInstalacao, string> = {
  INEXISTENTE: 'Inexistente',
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
};

export const HEALTH_INSTALACAO_LABELS: Record<HealthInstalacao, string> = {
  DESCONHECIDO: 'Desconhecido',
  SAUDAVEL: 'Saudável',
  DEGRADADO: 'Degradado',
  INDISPONIVEL: 'Indisponível',
};

export const AMBIENTE_INSTALACAO_LABELS: Record<AmbienteInstalacao, string> = {
  PROD: 'Produção',
  HOM: 'Homologação',
  DEV: 'Desenvolvimento',
  TEST: 'Teste',
};

export const TIPO_PORTA_LABELS: Record<TipoPorta, string> = {
  HTTP: 'HTTP',
  HTTPS: 'HTTPS',
  AJP: 'AJP',
  TOMCAT_SHUTDOWN: 'Tomcat shutdown',
  DEBUG: 'Debug / JDWP',
  JMX: 'JMX',
  BANCO: 'Banco local',
  OUTRO: 'Outro',
};

export const PAPEL_PORTA_LABELS: Record<PapelPorta, string> = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  OUTRO: 'Outro',
};

export const PROTOCOLO_PORTA_LABELS: Record<ProtocoloPorta, string> = {
  TCP: 'TCP',
  UDP: 'UDP',
};

export const STATUS_RESERVA_PORTA_LABELS: Record<StatusReservaPorta, string> = {
  DISPONIVEL: 'Disponível',
  RESERVADA: 'Reservada',
  EM_USO: 'Em uso',
  LIBERADA: 'Liberada',
  BLOQUEADA: 'Bloqueada',
};
