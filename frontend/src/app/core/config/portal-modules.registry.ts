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
    description: 'Gestão de manuais por cliente — módulos, páginas e publicações.',
    highlights: ['Conteúdo estruturado', 'Templates visuais', 'Publicação em PDF'],
    available: true,
  },
  {
    id: 'ai',
    label: 'Nexus AI',
    icon: 'pi-sparkles',
    route: '/ai',
    description: 'Assistente de IA para criar e ajustar páginas do DocFlow.',
    highlights: ['Briefing → rascunho', 'Módulo isolado', 'Pronto para extrair'],
    available: true,
  },
  {
    id: 'em-construcao',
    label: 'Em construção',
    icon: 'pi-cog',
    route: '/em-construcao',
    description: 'Módulos adicionais em preparação. Em breve no portal.',
    highlights: ['Novidades em breve'],
    available: false,
  },
] as const;
