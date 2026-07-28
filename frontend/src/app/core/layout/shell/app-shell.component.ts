import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { ACCENT_PRESETS, AccentPreset, ThemeService } from '@core/theme/theme.service';
import {
  AvatarComponent,
  CommandPaletteComponent,
  CommandPaletteService,
  IconButtonComponent,
  InstallPromptComponent,
  NotificationCenterComponent,
  NotificationService,
} from '@shared/ui';
import { SwUpdate } from '@angular/service-worker';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
  meta?: number;
  /** Se informado, item só aparece se o usuário tiver a permissão. */
  permissao?: string;
}
interface NavSection {
  label?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    IconButtonComponent,
    AvatarComponent,
    CommandPaletteComponent,
    NotificationCenterComponent,
    InstallPromptComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly palette = inject(CommandPaletteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  protected readonly mobileOpen = signal(false);
  protected readonly userMenuOpen = signal(false);
  protected readonly breadcrumb = signal(this.deriveBreadcrumb(this.router.url));
  protected readonly workspaceLabel = signal(this.deriveWorkspace(this.router.url).label);
  protected readonly workspaceIcon = signal(this.deriveWorkspace(this.router.url).icon);
  protected readonly moduleNavAtTop = signal(this.hasFullHeightModuleNav(this.router.url));

  private readonly sectionsTodas: NavSection[] = [
    { items: [{ label: 'Início', icon: 'House', route: '/', exact: true }] },
    {
      label: 'Módulos',
      items: [
        { label: 'DocFlow', icon: 'FileText', route: '/doc-flow' },
        { label: 'Release Orchestrator', icon: 'Tag', route: '/release-orchestrator' },
      ],
    },
    {
      label: 'Segurança',
      items: [{ label: 'Segurança', icon: 'Shield', route: '/seguranca', permissao: 'USUARIO:LER' }],
    },
  ];

  /** Menu filtrado pelas permissões do usuário autenticado. */
  protected readonly sections = computed<NavSection[]>(() => {
    const tem = this.auth.tem();
    return this.sectionsTodas
      .map(section => ({
        ...section,
        items: section.items.filter(item => !item.permissao || tem(item.permissao)),
      }))
      .filter(section => section.items.length > 0);
  });

  ngOnInit(): void {
    this.palette.registerMany('shell', [
      { id: 'nav-home', label: 'Ir para Início', group: 'Navegação', route: '/' },
      { id: 'nav-doc', label: 'Ir para DocFlow', group: 'Navegação', route: '/doc-flow' },
      {
        id: 'nav-rel',
        label: 'Ir para Release Orchestrator',
        group: 'Navegação',
        route: '/release-orchestrator',
      },
      { id: 'nav-seg', label: 'Ir para Segurança', group: 'Navegação', route: '/seguranca' },
      { id: 'theme', label: 'Alternar tema', group: 'Preferências', action: () => this.theme.toggle() },
      ...(Object.entries(ACCENT_PRESETS) as [AccentPreset, { label: string }][]).map(([id, p]) => ({
        id: `accent-${id}`,
        label: `Acento: ${p.label}`,
        group: 'Preferências',
        action: () => this.theme.setAccent(id),
      })),
      { id: 'logout', label: 'Sair', group: 'Sessão', action: () => this.auth.logout() },
    ]);

    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(e => {
        this.mobileOpen.set(false);
        this.userMenuOpen.set(false);
        const url = (e as NavigationEnd).urlAfterRedirects;
        const workspace = this.deriveWorkspace(url);
        this.moduleNavAtTop.set(this.hasFullHeightModuleNav(url));
        this.workspaceLabel.set(workspace.label);
        this.workspaceIcon.set(workspace.icon);
        this.breadcrumb.set(this.deriveBreadcrumb(url));
      });

    if (this.swUpdate?.isEnabled) {
      this.swUpdate.versionUpdates.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(evt => {
        if (evt.type === 'VERSION_READY') {
          this.notifications.add('info', 'Nova versão disponível', {
            description: 'Recarregue para aplicar a atualização.',
          });
        }
      });
    }
  }

  protected toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }
  protected toggleTheme(): void {
    this.theme.toggle();
  }
  protected openPalette(): void {
    this.palette.open();
  }
  protected logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  protected toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
  }
  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    if (this.userMenuOpen()) this.userMenuOpen.set(false);
  }
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.userMenuOpen()) this.userMenuOpen.set(false);
  }

  private deriveBreadcrumb(url: string): string {
    const segs = url.split(/[?#]/)[0]!.split('/').filter(Boolean);
    if (!segs.length) return 'Início';
    const segMap: Record<string, string> = {
      clientes: 'Clientes',
      projetos: 'Projetos',
      modulos: 'Módulos',
      paginas: 'Páginas',
      publicacoes: 'Publicações',
      busca: 'Busca',
      releases: 'Releases',
      produtos: 'Produtos',
      templates: 'Templates',
      builder: 'Builder',
      guia: 'Guia',
      usuarios: 'Usuários',
      grupos: 'Grupos',
      permissoes: 'Permissões',
      configuracoes: 'Configurações',
      novo: 'Novo',
      nova: 'Nova',
      editar: 'Editar',
      detalhe: 'Detalhe',
      revisao: 'Revisão',
    };
    const partes: string[] = [];
    // pular IDs (UUIDs ou hashes longos)
    const isId = (s: string) => /^[0-9a-f]{8,}/i.test(s) || /^\d+$/.test(s);
    for (let i = 1; i < segs.length; i++) {
      const s = segs[i];
      if (isId(s)) continue;
      partes.push(segMap[s] ?? s);
    }
    return partes.length ? partes.join(' › ') : 'Visão geral';
  }

  private deriveWorkspace(url: string): { label: string; icon: string } {
    const firstSegment = url.split(/[?#]/)[0]?.split('/').filter(Boolean)[0];
    const workspaces: Record<string, { label: string; icon: string }> = {
      'doc-flow': { label: 'Doc Flow', icon: 'FileText' },
      'release-orchestrator': { label: 'Release Orchestrator', icon: 'Tag' },
      seguranca: { label: 'Segurança', icon: 'Shield' },
    };
    return workspaces[firstSegment ?? ''] ?? { label: 'Softon Portal', icon: 'House' };
  }

  private hasFullHeightModuleNav(url: string): boolean {
    const path = url.split(/[?#]/)[0] ?? '';
    return path.startsWith('/doc-flow') || path.startsWith('/release-orchestrator');
  }
}
