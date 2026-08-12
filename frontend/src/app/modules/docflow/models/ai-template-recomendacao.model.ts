export interface AiTemplateCandidato {
  templateId: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  confianca: number;
  motivo: string;
}

export interface AiTemplateRecomendacao {
  recomendado: AiTemplateCandidato | null;
  candidatos: AiTemplateCandidato[];
  exigeConfirmacao: boolean;
}

export interface AiTemplateRecomendacaoPayload {
  briefing: string;
  projetoId?: string | null;
  clienteId?: string | null;
}
