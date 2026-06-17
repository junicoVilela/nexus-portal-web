export type ReleaseStatus =
  | 'RASCUNHO'
  | 'EM_DESENVOLVIMENTO'
  | 'EM_REVISAO'
  | 'APROVADA'
  | 'PUBLICADA'
  | 'CANCELADA';

export type TipoRelease = 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX' | 'FEATURE';

export interface Release {
  id: string;
  produtoId: string;
  produtoNome?: string;
  produtoSigla?: string;
  produtoCor?: string;
  versao: string;
  titulo: string;
  tipo: TipoRelease;
  status: ReleaseStatus;
  dataPrevista?: string;
  dataPublicacao?: string;
  publicadoPor?: string;
  responsavelId?: string;
  responsavel?: string;
  resumo?: string;
  observacoes?: string;
  totalItens?: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ReleaseForm {
  produtoId: string;
  versao: string;
  titulo: string;
  tipo: TipoRelease;
  status: ReleaseStatus;
  dataPrevista?: string;
  responsavelId?: string;
  resumo?: string;
  observacoes?: string;
}

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  RASCUNHO: 'Rascunho',
  EM_DESENVOLVIMENTO: 'Em desenvolvimento',
  EM_REVISAO: 'Em revisão',
  APROVADA: 'Aprovada',
  PUBLICADA: 'Publicada',
  CANCELADA: 'Cancelada',
};

export const RELEASE_TIPO_LABELS: Record<TipoRelease, string> = {
  MAJOR: 'Major',
  MINOR: 'Minor',
  PATCH: 'Patch',
  HOTFIX: 'Hotfix',
  FEATURE: 'Feature',
};

export const RELEASE_STATUS_FLOW: Partial<Record<ReleaseStatus, ReleaseStatus[]>> = {
  RASCUNHO: ['EM_DESENVOLVIMENTO', 'CANCELADA'],
  EM_DESENVOLVIMENTO: ['EM_REVISAO', 'CANCELADA'],
  EM_REVISAO: ['APROVADA', 'RASCUNHO', 'CANCELADA'],
  APROVADA: ['PUBLICADA', 'EM_REVISAO', 'CANCELADA'],
};

export function podeEditar(status: ReleaseStatus): boolean {
  return status === 'RASCUNHO' || status === 'EM_DESENVOLVIMENTO';
}

export function proximosStatus(status: ReleaseStatus): ReleaseStatus[] {
  return RELEASE_STATUS_FLOW[status] ?? [];
}
