export type AuditoriaResultado = 'SUCESSO' | 'FALHA';

export interface Auditoria {
  id: string;
  /** Quem disparou a ação (nulo se sistema/anônimo). */
  usuarioId: string | null;
  /** Login/nome do usuário no momento (caso o usuário seja removido depois). */
  usuarioLogin: string | null;
  /** Código curto da ação. Ex.: USUARIO:CRIAR, GRUPO_ACESSO:VINCULAR_PERMISSAO. */
  acao: string;
  /** Domínio funcional (ex.: SEGURANCA). */
  dominio: string | null;
  /** Funcionalidade afetada (ex.: USUARIO, GRUPO_ACESSO). */
  funcionalidade: string | null;
  /** Tipo do recurso afetado (ex.: 'usuario', 'grupo'). */
  recursoTipo: string | null;
  /** ID do recurso afetado. */
  recursoId: string | null;
  ipOrigem: string | null;
  /** Snapshot do estado anterior (objeto serializável). NUNCA contém senha. */
  dadosAnteriores: Record<string, unknown> | null;
  /** Snapshot do estado novo (objeto serializável). NUNCA contém senha. */
  dadosNovos: Record<string, unknown> | null;
  resultado: AuditoriaResultado;
  mensagem: string | null;
  criadoEm: string;
}
