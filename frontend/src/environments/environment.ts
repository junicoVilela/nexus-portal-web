export const environment = {
  production: false,
  version: '1.0.0',
  apiUrl: '/api/doc-flow',
  authApiUrl: '/api/v1/auth',
  rbacApiUrl: '/api/v1/rbac',
  releaseOrchestratorApiUrl: '/api/v1/release-orchestrator',
  /**
   * Latência simulada (ms) dos services mockados em `modules/seguranca`.
   * Dev: ~30 (perceptível como assíncrono, sem atrapalhar UX).
   * Produção: 0 (será descartado quando services migrarem para HttpClient real).
   */
  mockDelayMs: 30,
  /** Tamanho máximo dos rolos de auditoria e histórico de login no mock. */
  mockHistoryCap: 500,
};
