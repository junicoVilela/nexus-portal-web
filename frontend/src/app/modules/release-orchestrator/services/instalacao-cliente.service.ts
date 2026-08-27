import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '@env/environment';
import { PageResult } from '@shared/models/page-result.model';
import { buildQueryParams } from '@shared/utils/http-params.util';
import {
  AmbienteInstalacao,
  HealthInstalacao,
  InstalacaoCliente,
  InstalacaoClienteForm,
  PortasSugeridas,
  SugerirPortasOpts,
  StatusInstalacao,
  TipoImplantacao,
} from '../models/instalacao-cliente.model';
import { DeployInstalacao, ModoDeploy } from '../models/deploy-instalacao.model';
import {
  DispararBuildResult,
  OrigemBuild,
} from './release.service';

@Injectable({ providedIn: 'root' })
export class InstalacaoClienteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.releaseOrchestratorApiUrl}/instalacoes`;

  listar(
    page = 1,
    size = 20,
    q?: string,
    clienteId?: string,
    hostId?: string,
    produtoId?: string,
    tipoImplantacao?: TipoImplantacao,
    status?: StatusInstalacao,
    ambiente?: AmbienteInstalacao,
  ): Observable<PageResult<InstalacaoCliente>> {
    const params = buildQueryParams({
      page,
      size,
      q,
      clienteId,
      hostId,
      produtoId,
      tipoImplantacao,
      status,
      ambiente,
    });
    return this.http
      .get<PageResult<InstalacaoCliente>>(this.base, { params })
      .pipe(map(r => ({ ...r, items: r.items ?? [] })));
  }

  buscar(id: string): Observable<InstalacaoCliente> {
    return this.http.get<InstalacaoCliente>(`${this.base}/${id}`);
  }

  criar(form: InstalacaoClienteForm): Observable<InstalacaoCliente> {
    return this.http.post<InstalacaoCliente>(this.base, form);
  }

  atualizar(id: string, form: InstalacaoClienteForm): Observable<InstalacaoCliente> {
    return this.http.put<InstalacaoCliente>(`${this.base}/${id}`, form);
  }

  alterarStatus(id: string, status: StatusInstalacao): Observable<InstalacaoCliente> {
    return this.http.patch<InstalacaoCliente>(`${this.base}/${id}/status`, { status });
  }

  registrarHealth(
    id: string,
    body: { health: HealthInstalacao; versaoAtual?: string; ultimoErro?: string },
  ): Observable<InstalacaoCliente> {
    return this.http.patch<InstalacaoCliente>(`${this.base}/${id}/health`, body);
  }

  iniciar(id: string, modo: ModoDeploy = 'REAL'): Observable<DeployInstalacao> {
    return this.http.post<DeployInstalacao>(`${this.base}/${id}/start`, { modo });
  }

  parar(id: string, modo: ModoDeploy = 'REAL'): Observable<DeployInstalacao> {
    return this.http.post<DeployInstalacao>(`${this.base}/${id}/stop`, { modo });
  }

  listarFontesVersao(id: string): Observable<FontesVersaoInstalacao> {
    return this.http.get<FontesVersaoInstalacao>(`${this.base}/${id}/fontes-versao`, {
      headers: { 'X-Silent-Error': '1' },
    });
  }

  resolverVersao(
    id: string,
    body: { origem: OrigemBuild; tag?: string | null } = { origem: 'RELEASE_ATUAL' },
  ): Observable<ResolverVersaoInstalacao> {
    return this.http.post<ResolverVersaoInstalacao>(`${this.base}/${id}/resolver-versao`, body);
  }

  dispararBuild(
    id: string,
    body: { origem: OrigemBuild; tag?: string | null; alvoIds?: string[] } = { origem: 'RELEASE_ATUAL' },
  ): Observable<DispararBuildResult> {
    return this.http.post<DispararBuildResult>(`${this.base}/${id}/disparar-build`, body);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  sugerirPortas(hostId?: string, instalacaoId?: string, opts: SugerirPortasOpts = {}): Observable<PortasSugeridas> {
    const params = buildQueryParams({
      hostId,
      instalacaoId,
      backendInicio: opts.backendInicio,
      frontendInicio: opts.frontendInicio,
      quantidade: opts.quantidade,
    });
    return this.http.get<PortasSugeridas>(`${this.base}/portas-sugeridas`, { params });
  }
}

export interface OpcaoVersaoInstalacao {
  origem: OrigemBuild;
  tag: string | null;
  versao: string | null;
  releaseId: string | null;
  selecionavel: boolean;
  titulo?: string | null;
  aviso?: string | null;
  totalAssets?: number | null;
}

export interface FontesVersaoInstalacao {
  instalacaoId: string;
  produtoId: string;
  versaoInstalada?: string | null;
  jenkinsConfigurado: boolean;
  githubConfigurado: boolean;
  jenkinsJob?: string | null;
  aviso?: string | null;
  githubErro?: string | null;
  versaoAtual: OpcaoVersaoInstalacao;
  ultimaGerada?: OpcaoVersaoInstalacao | null;
  tags: OpcaoVersaoInstalacao[];
  alvos?: AlvoBuildInstalacao[];
  buildsRecentes?: BuildArtefatoStatus[];
}

export interface AlvoBuildInstalacao {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'MODULO' | 'PRODUTO' | string;
  produtoId: string;
  produtoSigla: string;
  jenkinsJob?: string | null;
  nomeArquivo?: string | null;
  padraoAsset?: string | null;
  doProdutoDaInstalacao: boolean;
  selecionadoPadrao: boolean;
}

export interface BuildArtefatoStatus {
  id: string;
  alvoId: string;
  produtoSigla: string;
  jenkinsJob: string;
  status: 'ENFILEIRADO' | 'SUCCESS' | 'FAILED' | string;
  nomeArquivo?: string | null;
  mensagem?: string | null;
  createdAt?: string | null;
}

export interface ResolverVersaoInstalacao {
  releaseId: string;
  tag: string;
  versao: string;
  origem: OrigemBuild;
  criada: boolean;
  aviso?: string | null;
}
