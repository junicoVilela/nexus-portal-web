/**
 * Catálogo de módulos disponíveis no portal.
 * Para novos módulos: adicionar aqui e registrar rota em app.routes.ts.
 */
export interface PortalModule {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly available: boolean;
}

export const PORTAL_MODULES: readonly PortalModule[] = [
  {
    id: 'doc-flow',
    label: 'DocFlow',
    icon: 'pi-book',
    route: '/doc-flow',
    description: 'Gestão de manuais por cliente — módulos, páginas, publicações e assistente IA.',
    highlights: ['Conteúdo estruturado', 'Templates visuais', 'Assistente IA'],
    available: true,
  },
  {
    id: 'release-orchestrator',
    label: 'Release Orchestrator',
    icon: 'pi-tag',
    route: '/release-orchestrator',
    description: 'Gestão de releases, entregas a clientes, delta de artefatos e pacotes.',
    highlights: ['Releases centralizadas', 'Controle de entregas', 'Rastreabilidade'],
    available: true,
  },
  {
    id: 'seguranca',
    label: 'Segurança',
    icon: 'pi-shield',
    route: '/seguranca',
    description: 'Usuários, grupos, permissões, sessões e trilha de auditoria.',
    highlights: ['RBAC', 'Sessões', 'Auditoria'],
    available: true,
  },
] as const;
