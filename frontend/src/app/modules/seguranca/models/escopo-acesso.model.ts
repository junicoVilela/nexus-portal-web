export type TipoAmbiente = 'DEV' | 'HML' | 'PRD' | 'SIMULADO';

export interface EscopoAcesso {
  id: string;
  /** Apenas um de `usuarioId` ou `grupoAcessoId` é preenchido. */
  usuarioId: string | null;
  grupoAcessoId: string | null;
  clienteId: string | null;
  ambienteId: string | null;
  produtoId: string | null;
  tipoAmbiente: TipoAmbiente | null;
  somenteLeitura: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
}

export interface EscopoAcessoForm {
  usuarioId?: string;
  grupoAcessoId?: string;
  clienteId?: string;
  ambienteId?: string;
  produtoId?: string;
  tipoAmbiente?: TipoAmbiente;
  somenteLeitura: boolean;
  ativo: boolean;
}
