import { TipoRelease } from './release.model';

export interface ReleaseTemplate {
  id: string;
  nome: string;
  descricao?: string;
  tipoRelease?: TipoRelease;
  produtoId?: string;
  estrutura: string;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReleaseTemplateForm {
  nome: string;
  descricao?: string;
  tipoRelease?: TipoRelease;
  produtoId?: string;
  estrutura: string;
  ativo: boolean;
}
