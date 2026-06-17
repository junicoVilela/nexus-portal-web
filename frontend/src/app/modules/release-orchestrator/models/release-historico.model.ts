export type AcaoHistorico =
  | 'CRIADA'
  | 'EDITADA'
  | 'ITEM_ADICIONADO'
  | 'ITEM_EDITADO'
  | 'ITEM_REMOVIDO'
  | 'ENVIADA_REVISAO'
  | 'APROVADA'
  | 'PUBLICADA'
  | 'CANCELADA'
  | 'REABERTA'
  | 'DUPLICADA'
  | 'PDF_GERADO'
  | 'ENVIADA_CLIENTE';

export interface ReleaseHistorico {
  id: string;
  releaseId: string;
  acao: AcaoHistorico;
  descricao: string;
  statusAnterior?: string;
  statusNovo?: string;
  usuario: string;
  createdAt: string;
}

export const ACAO_HISTORICO_LABELS: Record<AcaoHistorico, string> = {
  CRIADA: 'Release criada',
  EDITADA: 'Release editada',
  ITEM_ADICIONADO: 'Item adicionado',
  ITEM_EDITADO: 'Item editado',
  ITEM_REMOVIDO: 'Item removido',
  ENVIADA_REVISAO: 'Enviada para revisão',
  APROVADA: 'Release aprovada',
  PUBLICADA: 'Release publicada',
  CANCELADA: 'Release cancelada',
  REABERTA: 'Release reaberta',
  DUPLICADA: 'Release duplicada',
  PDF_GERADO: 'PDF gerado',
  ENVIADA_CLIENTE: 'Enviada ao cliente',
};

export const ACAO_HISTORICO_ICONES: Record<AcaoHistorico, string> = {
  CRIADA: 'pi-plus-circle',
  EDITADA: 'pi-pencil',
  ITEM_ADICIONADO: 'pi-list',
  ITEM_EDITADO: 'pi-list',
  ITEM_REMOVIDO: 'pi-trash',
  ENVIADA_REVISAO: 'pi-send',
  APROVADA: 'pi-check-circle',
  PUBLICADA: 'pi-globe',
  CANCELADA: 'pi-times-circle',
  REABERTA: 'pi-refresh',
  DUPLICADA: 'pi-copy',
  PDF_GERADO: 'pi-file-pdf',
  ENVIADA_CLIENTE: 'pi-envelope',
};

export const ACAO_HISTORICO_ICONES_LUCIDE: Record<AcaoHistorico, string> = {
  CRIADA: 'Plus',
  EDITADA: 'Pencil',
  ITEM_ADICIONADO: 'List',
  ITEM_EDITADO: 'List',
  ITEM_REMOVIDO: 'Trash2',
  ENVIADA_REVISAO: 'ArrowRight',
  APROVADA: 'CheckCircle',
  PUBLICADA: 'Globe',
  CANCELADA: 'XCircle',
  REABERTA: 'RotateCw',
  DUPLICADA: 'Copy',
  PDF_GERADO: 'FileText',
  ENVIADA_CLIENTE: 'ExternalLink',
};

export const ACAO_HISTORICO_TONS: Record<AcaoHistorico, 'neutral' | 'success' | 'warn' | 'danger' | 'info'> =
  {
    CRIADA: 'info',
    EDITADA: 'neutral',
    ITEM_ADICIONADO: 'neutral',
    ITEM_EDITADO: 'neutral',
    ITEM_REMOVIDO: 'warn',
    ENVIADA_REVISAO: 'warn',
    APROVADA: 'success',
    PUBLICADA: 'success',
    CANCELADA: 'danger',
    REABERTA: 'info',
    DUPLICADA: 'neutral',
    PDF_GERADO: 'neutral',
    ENVIADA_CLIENTE: 'info',
  };
