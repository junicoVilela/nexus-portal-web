export type AiObjetivo = 'CRIAR_PAGINA' | 'ATUALIZAR_PAGINA';

export type AiSessaoStatus =
  | 'ABERTA'
  | 'AGUARDANDO_USUARIO'
  | 'PRONTA_PARA_GERAR'
  | 'GERANDO'
  | 'PRONTA'
  | 'APLICADA'
  | 'CANCELADA'
  | 'ERRO';

export type AiPapelMensagem = 'USUARIO' | 'ASSISTENTE' | 'SISTEMA';

export interface AiPergunta {
  id: string;
  texto: string;
  opcoes: string[];
  obrigatoria: boolean;
}

export interface AiMensagem {
  id: string;
  papel: AiPapelMensagem;
  conteudo: string;
  perguntas: AiPergunta[];
  ordem: number;
  createdAt: string;
}

export interface AiSessao {
  id: string;
  objetivo: AiObjetivo;
  status: AiSessaoStatus;
  projetoId: string | null;
  moduloId: string | null;
  clienteId: string | null;
  paginaId: string | null;
  templateId: string | null;
  briefing: string;
  mensagens: AiMensagem[];
  createdAt: string;
  updatedAt: string;
}

export interface CriarAiSessaoPayload {
  objetivo: AiObjetivo;
  briefing: string;
  projetoId?: string | null;
  moduloId?: string | null;
  clienteId?: string | null;
  templateId?: string | null;
  paginaId?: string | null;
}

export interface AiMensagemPayload {
  conteudo: string;
  respostas?: Record<string, string>;
}
