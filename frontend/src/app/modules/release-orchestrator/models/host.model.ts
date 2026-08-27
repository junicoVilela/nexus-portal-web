export type SistemaOperacionalHost = 'WINDOWS' | 'LINUX';
export type TipoConexaoHost = 'SSH' | 'WINRM' | 'DOCKER';

export interface Host {
  id: string;
  codigo: string;
  nome: string;
  hostname: string;
  enderecoIp?: string;
  sistemaOperacional: SistemaOperacionalHost;
  dockerDisponivel: boolean;
  tipoConexao: TipoConexaoHost;
  portaConexao?: number;
  usuarioConexao?: string;
  credencialRef?: string;
  ativo: boolean;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HostForm {
  codigo: string;
  nome: string;
  hostname: string;
  enderecoIp?: string;
  sistemaOperacional: SistemaOperacionalHost;
  dockerDisponivel?: boolean;
  tipoConexao?: TipoConexaoHost;
  portaConexao?: number;
  usuarioConexao?: string;
  credencialRef?: string;
  observacoes?: string;
  ativo?: boolean;
}

export const SISTEMA_OPERACIONAL_LABELS: Record<SistemaOperacionalHost, string> = {
  WINDOWS: 'Windows',
  LINUX: 'Linux',
};

export const TIPO_CONEXAO_LABELS: Record<TipoConexaoHost, string> = {
  SSH: 'SSH',
  WINRM: 'WinRM',
  DOCKER: 'Docker API',
};
