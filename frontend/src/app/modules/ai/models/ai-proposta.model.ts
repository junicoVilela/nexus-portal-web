export interface AiQualidadeItem {
  codigo: string;
  titulo: string;
  descricao: string;
  ok: boolean;
  severidade: string;
}

export interface AiProposta {
  id: string;
  sessaoId: string;
  jobId: string;
  tipo: 'NOVA' | 'ATUALIZACAO';
  titulo: string;
  slug: string;
  codigoTela: string;
  resumo: string | null;
  conteudoHtml: string;
  templateId: string | null;
  templateVersao: number | null;
  aptoParaRevisao: boolean;
  qualidade: AiQualidadeItem[];
  status: 'PENDENTE' | 'ACEITA' | 'REJEITADA' | 'DESCARTADA';
  paginaId: string | null;
  createdAt: string;
}

export interface AiJob {
  id: string;
  sessaoId: string;
  tipo: string;
  status: 'PENDENTE' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO';
  erroMensagem: string | null;
  modelo: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface AiAplicacao {
  modo: 'FORM' | 'PERSISTIR';
  propostaId: string;
  paginaId: string | null;
  titulo: string;
  slug: string;
  codigoTela: string;
  resumo: string | null;
  conteudoHtml: string;
  templateOrigemId: string | null;
  templateOrigemVersao: number | null;
  moduloId: string | null;
}
