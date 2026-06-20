export interface ArtefatoReleaseModulo {
  id: string;
  releaseId: string;
  moduloProdutoId: string;
  nomeArquivo: string;
  sha256: string;
  tamanhoBytes: number;
  observacao?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}
