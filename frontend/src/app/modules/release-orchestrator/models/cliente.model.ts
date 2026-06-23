export type AmbientePadrao = 'PROD' | 'HOM' | 'DEV' | 'TEST';
export type TipoBanco = 'ORACLE' | 'SQLSERVER' | 'POSTGRES';
export type PapelContato = 'TECNICO' | 'COMERCIAL' | 'OPERACIONAL' | 'FINANCEIRO' | 'OUTRO';
export type TipoDestinoEntrega = 'PASTA' | 'FTP' | 'SFTP' | 'BUCKET';
export type OrigemFuncionalidade = 'MANUAL' | 'TEMPLATE' | 'HERDADA';

export interface Cliente {
  id: string;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  sigla: string;
  ativo: boolean;
  responsavelComercialId?: string;
  ambientePadrao: AmbientePadrao;
  tipoBanco?: TipoBanco;
  codificacao?: string;
  fusoHorario?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClienteForm {
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  sigla: string;
  responsavelComercialId?: string;
  ambientePadrao: AmbientePadrao;
  tipoBanco?: TipoBanco;
  codificacao?: string;
  fusoHorario?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface Contato {
  id: string;
  clienteId: string;
  nome: string;
  papel: PapelContato;
  email: string;
  telefone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContatoForm {
  nome: string;
  papel: PapelContato;
  email: string;
  telefone?: string;
}

export interface ConfigEntrega {
  id: string;
  clienteId: string;
  tipoDestino: TipoDestinoEntrega;
  caminhoBase?: string;
  exigirAprovacao: boolean;
  emailsNotificacao?: string;
  host?: string;
  porta?: number;
  usuario?: string;
  /** True quando há senha cifrada no banco; o valor nunca é devolvido. */
  senhaConfigurada?: boolean;
  modoPassivo?: boolean;
  strictHostCheck?: boolean;
  /** Destino BUCKET (S3/MinIO). */
  bucket?: string;
  endpoint?: string;
  regiao?: string;
  pathStyleAccess?: boolean;
  updatedAt?: string;
}

export interface ConfigEntregaForm {
  tipoDestino: TipoDestinoEntrega;
  caminhoBase?: string;
  exigirAprovacao?: boolean;
  emailsNotificacao?: string;
  host?: string;
  porta?: number;
  /** FTP/SFTP: usuário. BUCKET: access key. */
  usuario?: string;
  /** Em branco no PUT preserva a senha atual cifrada no backend. */
  senha?: string;
  modoPassivo?: boolean;
  strictHostCheck?: boolean;
  /** Destino BUCKET (S3/MinIO). */
  bucket?: string;
  endpoint?: string;
  regiao?: string;
  pathStyleAccess?: boolean;
}

export const AMBIENTE_LABELS: Record<AmbientePadrao, string> = {
  PROD: 'Produção',
  HOM: 'Homologação',
  DEV: 'Desenvolvimento',
  TEST: 'Teste',
};

export const TIPO_BANCO_LABELS: Record<TipoBanco, string> = {
  ORACLE: 'Oracle',
  SQLSERVER: 'SQL Server',
  POSTGRES: 'PostgreSQL',
};

export const PAPEL_CONTATO_LABELS: Record<PapelContato, string> = {
  TECNICO: 'Técnico',
  COMERCIAL: 'Comercial',
  OPERACIONAL: 'Operacional',
  FINANCEIRO: 'Financeiro',
  OUTRO: 'Outro',
};

export const TIPO_DESTINO_LABELS: Record<TipoDestinoEntrega, string> = {
  PASTA: 'Pasta local',
  FTP: 'FTP',
  SFTP: 'SFTP',
  BUCKET: 'Bucket (S3/MinIO)',
};
