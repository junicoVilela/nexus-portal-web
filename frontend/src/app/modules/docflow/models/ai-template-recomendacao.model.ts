export interface AiTemplateCandidato {
  templateId: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  confianca: number;
  motivo: string;
}

export type AiComponenteNecessidade = 'OBRIGATORIA' | 'RECOMENDADA' | 'OPCIONAL' | 'CONTEXTUAL';

export interface AiComponenteCandidato {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  visual: string;
  necessidade: AiComponenteNecessidade;
  obrigatorio: boolean;
  motivo: string;
}

export interface AiTemplateRecomendacao {
  recomendado: AiTemplateCandidato | null;
  candidatos: AiTemplateCandidato[];
  exigeConfirmacao: boolean;
  blueprintId: string | null;
  blueprintNome: string | null;
  totalBiblioteca: number;
  componentes: AiComponenteCandidato[];
}

export interface AiTemplateRecomendacaoPayload {
  briefing: string;
  projetoId?: string | null;
  clienteId?: string | null;
  templateId?: string | null;
}
