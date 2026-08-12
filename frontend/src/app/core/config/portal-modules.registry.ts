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
    id: 'em-construcao',
    label: 'Em construção',
    icon: 'pi-cog',
    route: '/em-construcao',
    description: 'Módulos adicionais em preparação. Em breve no portal.',
    highlights: ['Novidades em breve'],
    available: false,
  },
] as const;
