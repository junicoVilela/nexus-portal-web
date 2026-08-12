export type AiTipoDocumento = 'DOC' | 'DOCX' | 'PDF' | 'TXT';
export type AiImportacaoStatus = 'PRONTO_PARA_REVISAO' | 'EM_REVISAO' | 'CONCLUIDA';
export type AiPaginaPlanoStatus = 'PENDENTE' | 'EM_EDICAO' | 'GERADA' | 'REVISADA';

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
  modulos: AiModuloDocumento[];
  avisos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AiPaginaDocumentoSelecionada extends AiPaginaDocumento {
  importacaoId: string;
  moduloNome: string;
}
