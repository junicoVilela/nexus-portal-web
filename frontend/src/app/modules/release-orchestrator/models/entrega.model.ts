import { AmbientePadrao } from './cliente.model';
import { HealthInstalacao, StatusInstalacao } from './instalacao-cliente.model';

export type StatusEntrega = 'RASCUNHO' | 'EM_GERACAO' | 'CONCLUIDA' | 'FALHA' | 'CANCELADA';
export type StatusPublicacao = 'NAO_APLICAVEL' | 'PENDENTE' | 'OK' | 'FALHA';

export interface InstalacaoAlvoEntrega {
  id: string;
  codigo: string;
  nome: string;
  hostCodigo: string;
  tipoImplantacao?: string;
  status: StatusInstalacao;
  health: HealthInstalacao;
  versaoAtual?: string;
}

export interface Entrega {
  id: string;
  clienteId: string;
  clienteSigla: string;
  clienteNome: string;
  produtoId: string;
  produtoSigla: string;
  produtoNome: string;
  releaseId: string;
  releaseVersao: string;
  proximaEntregaId?: string;
  entregaOriginalId?: string;
  ambiente: AmbientePadrao;
  status: StatusEntrega;
  dataInicioGeracao?: string;
  dataConclusao?: string;
  responsavelId?: string;
  arquivoPacoteCaminho?: string;
  arquivoPacoteSha256?: string;
  tamanhoBytes?: number;
  observacoes?: string;
  falhaMotivo?: string;
  /** Publicação remota (F3 P2) — campos do retry job. */
  statusPublicacao?: StatusPublicacao;
  tentativasPublicacao?: number;
  proximaTentativaEm?: string;
  ultimaFalhaPublicacao?: string;
  dataPublicacao?: string;
  destinoPublicacao?: string;
  instalacoes?: InstalacaoAlvoEntrega[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CriarEntregaForm {
  clienteId: string;
  produtoId: string;
  releaseId: string;
  ambiente: AmbientePadrao;
  proximaEntregaId?: string;
  responsavelId?: string;
  observacoes?: string;
  instalacaoIds?: string[];
}

export interface AtualizarEntregaRascunhoForm {
  ambiente?: AmbientePadrao;
  responsavelId?: string;
  observacoes?: string;
}

export const STATUS_ENTREGA_LABELS: Record<StatusEntrega, string> = {
  RASCUNHO: 'Rascunho',
  EM_GERACAO: 'Em geração',
  CONCLUIDA: 'Concluída',
  FALHA: 'Falha',
  CANCELADA: 'Cancelada',
};

export const STATUS_ENTREGA_TONES: Record<
  StatusEntrega,
  'neutral' | 'success' | 'info' | 'warn' | 'danger'
> = {
  RASCUNHO: 'neutral',
  EM_GERACAO: 'info',
  CONCLUIDA: 'success',
  FALHA: 'danger',
  CANCELADA: 'neutral',
};

/** Transições válidas client-side (espelha backend StatusEntrega). */
export const TRANSICOES_ENTREGA: Record<StatusEntrega, StatusEntrega[]> = {
  RASCUNHO: ['EM_GERACAO', 'CANCELADA'],
  EM_GERACAO: ['CONCLUIDA', 'FALHA', 'CANCELADA'],
  FALHA: ['EM_GERACAO'],
  CONCLUIDA: [],
  CANCELADA: [],
};

export const STATUS_PUBLICACAO_LABELS: Record<StatusPublicacao, string> = {
  NAO_APLICAVEL: 'Local (sem publicação)',
  PENDENTE: 'Aguardando publicação',
  OK: 'Publicada',
  FALHA: 'Falhou',
};

export const STATUS_PUBLICACAO_TONES: Record<
  StatusPublicacao,
  'neutral' | 'success' | 'info' | 'warn' | 'danger'
> = {
  NAO_APLICAVEL: 'neutral',
  PENDENTE: 'info',
  OK: 'success',
  FALHA: 'danger',
};

/** Formata tamanho em bytes para representação humana (KB/MB/GB). */
export function formatarTamanho(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
