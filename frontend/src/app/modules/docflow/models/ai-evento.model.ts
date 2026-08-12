export interface AiJobEvento {
  jobId: string;
  sessaoId: string;
  status: 'PENDENTE' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO' | 'CANCELADO';
  etapa:
    | 'AGUARDANDO'
    | 'PREPARANDO_CONTEXTO'
    | 'SELECIONANDO_ESTRUTURA'
    | 'GERANDO_CONTEUDO'
    | 'VALIDANDO_QUALIDADE'
    | 'FINALIZANDO'
    | 'CONCLUIDA'
    | 'CANCELADA'
    | 'FALHA';
  progresso: number;
  tentativa: number;
  diagnosticoId?: string;
}
