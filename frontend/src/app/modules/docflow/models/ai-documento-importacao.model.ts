export type AiTipoDocumento = 'DOC' | 'DOCX' | 'PDF' | 'TXT';
export type AiImportacaoStatus = 'PRONTO_PARA_REVISAO' | 'EM_REVISAO' | 'CONCLUIDA';
export type AiPaginaPlanoStatus = 'PENDENTE' | 'EM_EDICAO' | 'GERADA' | 'REVISADA';
export type AiDocumentoProjetoModo = 'NOVO_PROJETO' | 'PROJETO_EXISTENTE';
export type AiDocumentoClienteModo = 'SEM_CLIENTE' | 'CLIENTE_EXISTENTE' | 'NOVO_CLIENTE';

export interface AiPaginaDocumento {
  id: string;
  titulo: string;
  ordem: number;
  briefing: string;
  templateId: string | null;
  templateCodigo: string | null;
  templateNome: string | null;
  confiancaTemplate: number;
  motivoTemplate: string;
  status: AiPaginaPlanoStatus;
}

export interface AiModuloDocumento {
  id: string;
  moduloId: string | null;
  nome: string;
  ordem: number;
  paginas: AiPaginaDocumento[];
}

export interface AiDocumentoImportacao {
  id: string;
  nomeArquivo: string;
  tipoArquivo: AiTipoDocumento;
  mimeType: string;
  tamanhoBytes: number;
  caracteresExtraidos: number;
  totalPaginasOrigem: number;
  status: AiImportacaoStatus;
  version: number;
  projetoNome: string;
  projetoDescricao: string | null;
  projetoId: string | null;
  clienteId: string | null;
  estruturaConfirmada: boolean;
  modulos: AiModuloDocumento[];
  avisos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AiPaginaDocumentoSelecionada extends AiPaginaDocumento {
  importacaoId: string;
  moduloNome: string;
  moduloId: string;
  projetoId: string;
  clienteId: string | null;
}

export interface AiConfirmarEstruturaDocumentoPayload {
  modoProjeto: AiDocumentoProjetoModo;
  modoCliente: AiDocumentoClienteModo;
  projetoId: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  projetoNome: string | null;
  projetoDescricao: string | null;
  modulos: Array<{ planoId: string; nome: string }>;
}
