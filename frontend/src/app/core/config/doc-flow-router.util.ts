/**
 * Gera comandos de rota para navegação dentro do módulo Doc Flow.
 * Doc Flow está sempre sob o prefixo `/doc-flow`.
 */
export function docFlowRouterCommands(segments: (string | number)[]): (string | number)[] {
  if (segments.length === 0) {
    return ['doc-flow'];
  }
  return ['doc-flow', ...segments];
}
