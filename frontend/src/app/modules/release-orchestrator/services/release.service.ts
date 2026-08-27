import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import { Release, ReleaseForm, ReleaseStatus, ReleaseDisponivelDeploy } from '../models/release.model';
import { ReleaseHistorico } from '../models/release-historico.model';
import { ManifestoImplantacao } from '../models/deploy-instalacao.model';

export interface ReleaseFilter {
  produtoId?: string;
  status?: ReleaseStatus;
  tipo?: string;
  responsavelId?: string;
  dataPrevistaInicio?: string;
  dataPrevistaFim?: string;
  dataPublicacaoInicio?: string;
  dataPublicacaoFim?: string;
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

@Injectable({ providedIn: 'root' })
export class ReleaseService {
  private readonly base = `${environment.releaseOrchestratorApiUrl}/releases`;

  constructor(private readonly http: HttpClient) {}

  listar(filter: ReleaseFilter): Observable<PageResult<Release>> {
    const params = buildQueryParams({ ...filter });
    return this.http
      .get<PageResult<Release>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  listarDisponiveisDeploy(produtoId: string): Observable<ReleaseDisponivelDeploy[]> {
    const params = buildQueryParams({ produtoId });
    return this.http
      .get<ReleaseDisponivelDeploy[]>(`${this.base}/disponiveis-deploy`, { params })
      .pipe(map(r => r ?? []));
  }

  buscarPorId(id: string): Observable<Release> {
    return this.http.get<Release>(`${this.base}/${id}`);
  }

  criar(data: ReleaseForm): Observable<Release> {
    return this.http.post<Release>(this.base, data);
  }

  atualizar(id: string, data: ReleaseForm): Observable<Release> {
    return this.http.put<Release>(`${this.base}/${id}`, data);
  }

  alterarStatus(id: string, status: ReleaseStatus, observacao?: string): Observable<Release> {
    return this.http.patch<Release>(`${this.base}/${id}/status`, { status, observacao });
  }

  publicar(id: string): Observable<Release> {
    return this.http.post<Release>(`${this.base}/${id}/publicar`, {});
  }

  cancelar(id: string, motivo?: string): Observable<Release> {
    return this.http.post<Release>(`${this.base}/${id}/cancelar`, { motivo });
  }

  duplicar(id: string): Observable<Release> {
    return this.http.post<Release>(`${this.base}/${id}/duplicar`, {});
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listarHistorico(id: string): Observable<ReleaseHistorico[]> {
    return this.http.get<ReleaseHistorico[]>(`${this.base}/${id}/historico`).pipe(map(r => r ?? []));
  }

  listarManifestos(id: string): Observable<ManifestoImplantacao[]> {
    return this.http.get<ManifestoImplantacao[]>(`${this.base}/${id}/manifestos`).pipe(map(r => r ?? []));
  }

  listarFontesBuild(id: string): Observable<FontesBuild> {
    return this.http.get<FontesBuild>(`${this.base}/${id}/fontes-build`, {
      headers: { 'X-Silent-Error': '1' },
    });
  }

  dispararBuild(
    id: string,
    body: { origem: OrigemBuild; tag?: string | null } = { origem: 'RELEASE_ATUAL' },
  ): Observable<DispararBuildResult> {
    return this.http.post<DispararBuildResult>(`${this.base}/${id}/disparar-build`, body);
  }

  salvarManifesto(
    id: string,
    body: {
      tipoImplantacao: ManifestoImplantacao['tipoImplantacao'];
      imagemRef?: string;
      arquivoImagemRef?: string;
      diretorioInstalacao?: string;
      observacoes?: string;
    },
  ): Observable<ManifestoImplantacao> {
    return this.http.put<ManifestoImplantacao>(`${this.base}/${id}/manifestos`, body);
  }

  validarRevisao(id: string): Observable<RevisaoValidacao> {
    return this.http.get<RevisaoValidacao>(`${this.base}/${id}/validar`);
  }
}

export interface RevisaoValidacao {
  valida: boolean;
  pendencias: string[];
  alertas: string[];
  totalItensCliente: number;
  totalItensInternos: number;
}

export type OrigemBuild = 'RELEASE_ATUAL' | 'TAG_ESPECIFICA' | 'ULTIMA_GERADA';

/** Versão de portal/Jenkins a partir da tag ou branch escolhida. */
export function versaoPortalDaTag(tag: string | null | undefined): string {
  if (!tag) return '';
  let v = tag.trim().replace(/^refs\/(heads|tags)\//, '');
  if (v.startsWith('release/')) v = v.slice('release/'.length);
  if (v.includes('/')) return v.replaceAll('/', '-');
  return v.replace(/^v/i, '');
}

export interface FonteBuild {
  origem: OrigemBuild;
  tag: string;
  versao: string;
  totalAssets?: number | null;
  publishedAt?: string | null;
}

export interface TagBuild {
  tag: string;
  versao: string;
  temGithubRelease: boolean;
  totalAssets?: number | null;
}

export interface FontesBuild {
  releaseId: string;
  versaoRelease: string;
  jenkinsConfigurado: boolean;
  githubConfigurado: boolean;
  jenkinsUrl?: string | null;
  jenkinsJob?: string | null;
  aviso?: string | null;
  githubErro?: string | null;
  releaseAtual: FonteBuild;
  ultimaGerada?: FonteBuild | null;
  tags: TagBuild[];
}

export interface DispararBuildResult {
  origem: OrigemBuild;
  tag: string;
  versao: string;
  releaseId: string;
  releaseIdAfetada?: string | null;
  jenkinsJob: string;
  queueUrl?: string | null;
  ultimoBuildStatus?: string | null;
  aviso?: string | null;
  jobs?: { alvoId?: string | null; produtoSigla: string; jenkinsJob: string; tag?: string; queueUrl?: string | null; aviso?: string | null }[];
}
