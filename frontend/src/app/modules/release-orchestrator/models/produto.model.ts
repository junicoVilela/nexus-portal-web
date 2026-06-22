export interface Produto {
  id: string;
  nome: string;
  sigla: string;
  descricao?: string;
  cor: string;
  icone?: string;
  logoUrl?: string;
  responsavelId?: string;
  responsavel?: string;
  ativo: boolean;
  repositorioGithub?: string;
  branchPadrao?: string;
  padraoTag?: string;
  githubTokenConfigurado?: boolean;
  jenkinsUrl?: string;
  jenkinsJob?: string;
  jenkinsUser?: string;
  jenkinsTriggerMode?: string;
  jenkinsTokenConfigurado?: boolean;
  totalReleases?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProdutoForm {
  nome: string;
  sigla: string;
  descricao?: string;
  cor: string;
  responsavelId?: string;
  ativo: boolean;
  repositorioGithub?: string;
  branchPadrao?: string;
  padraoTag?: string;
  /** Envie em branco/null em PUT para preservar o token atual. */
  githubToken?: string;
  jenkinsUrl?: string;
  jenkinsJob?: string;
  jenkinsUser?: string;
  /** Envie em branco/null em PUT para preservar o token atual. */
  jenkinsToken?: string;
  jenkinsTriggerMode?: string;
}

export interface TestarGithubForm {
  repositorioGithub?: string;
  githubToken?: string;
}

export interface TestarGithubResult {
  sucesso: boolean;
  repositorio?: string;
  erro?: string;
  releasesRecentes?: {
    tagName: string;
    name?: string;
    publishedAt?: string;
    totalAssets: number;
  }[];
}

export interface TestarJenkinsForm {
  jenkinsUrl?: string;
  jenkinsJob?: string;
  jenkinsUser?: string;
  jenkinsToken?: string;
}

export interface TestarJenkinsResult {
  sucesso: boolean;
  jenkinsUrl?: string;
  jenkinsJob?: string;
  erro?: string;
  ultimoBuild?: {
    number: number;
    result?: string;
    building: boolean;
    timestamp: number;
    durationMs: number;
    url: string;
  };
}
