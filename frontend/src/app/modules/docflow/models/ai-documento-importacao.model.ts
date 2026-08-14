export type AiTipoDocumento = 'DOC' | 'DOCX' | 'PDF' | 'TXT';
export type AiImportacaoStatus = 'ANALISANDO_ESTRUTURA' | 'PRONTO_PARA_REVISAO' | 'EM_REVISAO' | 'CONCLUIDA';
export type AiPaginaPlanoStatus = 'PENDENTE' | 'EM_EDICAO' | 'EM_GERACAO' | 'GERADA' | 'REVISADA' | 'ERRO';
export type AiPaginaPlanoOrigem = 'DOCUMENTO' | 'IA' | 'MANUAL' | 'DIVISAO' | 'MESCLAGEM';
export type AiDocumentoAnaliseOrigem = 'ESTRUTURAL' | 'LLM';
export type AiDocumentoSugestaoTipo =
  'ADICIONAR_PAGINA' | 'RENOMEAR_PAGINA' | 'MOVER_PAGINA' | 'MESCLAR_PAGINAS' | 'RENOMEAR_MODULO';
export type AiDocumentoSugestaoStatus = 'PENDENTE' | 'APLICADA' | 'IGNORADA';
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
  paginaId: string | null;
  sessaoId: string | null;
  erroMensagem: string | null;
  origem: AiPaginaPlanoOrigem;
  ajustadaManualmente: boolean;
  blueprintId?: string | null;
  blueprintNome?: string | null;
  componentesSelecionados?: string[];
  componentesObrigatorios?: string[];
  composicaoAjustadaManualmente?: boolean;
}

export interface AiModuloDocumento {
  id: string;
  moduloId: string | null;
  nome: string;
  ordem: number;
  paginas: AiPaginaDocumento[];
}

export interface AiDocumentoSugestao {
  id: string;
  tipo: AiDocumentoSugestaoTipo;
  titulo: string;
  justificativa: string;
  confianca: number;
  status: AiDocumentoSugestaoStatus;
  aplicacaoSegura: boolean;
  paginaOrigemId: string | null;
  paginaDestinoId: string | null;
  moduloOrigemId: string | null;
  moduloDestinoId: string | null;
  valorSugerido: string | null;
  conteudoSugerido: string | null;
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
  projetoNomesSugeridos: string[];
  analiseOrigem: AiDocumentoAnaliseOrigem;
  analiseMensagem: string | null;
  tokensEntradaAnalise: number | null;
  tokensSaidaAnalise: number | null;
  sugestoes: AiDocumentoSugestao[];
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
  modulos: { planoId: string; nome: string }[];
}

export interface AiReordenarEstruturaDocumentoPayload {
  version: number;
  modulos: {
    planoId: string;
    nome: string;
    paginas: {
      planoId: string;
      titulo: string;
      conteudo: string;
      origem: AiPaginaPlanoOrigem;
      ajustadaManualmente: boolean;
    }[];
  }[];
}

export interface AiAtualizarComposicaoDocumentoPayload {
  version: number;
  componentesSelecionados: string[];
}

export interface AiEstimativaLoteDocumento {
  paginas: number;
  caracteresEntrada: number;
  tokensEntradaEstimados: number;
  tokensSaidaEstimados: number;
  modelo: string;
  observacao: string;
}
