import { AmbientePadrao } from './cliente.model';

export type PrioridadeEntrega = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type StatusProximaEntrega =
  | 'PLANEJADA'
  | 'AGENDADA'
  | 'REPLANEJADA'
  | 'ATRASADA'
  | 'CONVERTIDA'
  | 'CANCELADA';

export interface ProximaEntrega {
  id: string;
  clienteId: string;
  clienteSigla: string;
  clienteNome: string;
  produtoId: string;
  produtoSigla: string;
  produtoNome: string;
  releaseId?: string;
  releaseVersao?: string;
  dataPrevista: string;
  ambiente: AmbientePadrao;
  prioridade: PrioridadeEntrega;
  status: StatusProximaEntrega;
  responsavelId?: string;
  observacoes?: string;
  entregaConvertidaId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProximaEntregaForm {
  clienteId: string;
  produtoId: string;
  releaseId?: string;
  dataPrevista: string;
  ambiente: AmbientePadrao;
  prioridade: PrioridadeEntrega;
  responsavelId?: string;
  observacoes?: string;
}

export const PRIORIDADE_LABELS: Record<PrioridadeEntrega, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const PRIORIDADE_TONES: Record<PrioridadeEntrega, 'neutral' | 'info' | 'warn' | 'danger'> = {
  BAIXA: 'neutral',
  MEDIA: 'info',
  ALTA: 'warn',
  CRITICA: 'danger',
};

export const STATUS_PE_LABELS: Record<StatusProximaEntrega, string> = {
  PLANEJADA: 'Planejada',
  AGENDADA: 'Agendada',
  REPLANEJADA: 'Replanejada',
  ATRASADA: 'Atrasada',
  CONVERTIDA: 'Convertida',
  CANCELADA: 'Cancelada',
};

export const STATUS_PE_TONES: Record<StatusProximaEntrega, 'neutral' | 'success' | 'info' | 'warn' | 'danger'> = {
  PLANEJADA: 'neutral',
  AGENDADA: 'info',
  REPLANEJADA: 'info',
  ATRASADA: 'warn',
  CONVERTIDA: 'success',
  CANCELADA: 'danger',
};

/** Transições válidas client-side (espelha backend StatusProximaEntrega). */
export const TRANSICOES_PE: Record<StatusProximaEntrega, StatusProximaEntrega[]> = {
  PLANEJADA: ['AGENDADA', 'REPLANEJADA', 'CANCELADA'],
  AGENDADA: ['REPLANEJADA', 'ATRASADA', 'CONVERTIDA', 'CANCELADA'],
  REPLANEJADA: ['AGENDADA', 'ATRASADA', 'CONVERTIDA', 'CANCELADA'],
  ATRASADA: ['REPLANEJADA', 'CONVERTIDA', 'CANCELADA'],
  CONVERTIDA: [],
  CANCELADA: [],
};
