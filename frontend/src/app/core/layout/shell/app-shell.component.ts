import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  BadgeComponent,
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
    BadgeComponent,
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
  protected readonly breadcrumb = signal<string>('Início');

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
      { id: 'nav-rel', label: 'Ir para Release Orchestrator', group: 'Navegação', route: '/release-orchestrator' },
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
        this.breadcrumb.set(this.deriveBreadcrumb((e as NavigationEnd).urlAfterRedirects));
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
    this.auth.logout();
  }

  private deriveBreadcrumb(url: string): string {
    const segs = url.split(/[?#]/)[0]!.split('/').filter(Boolean);
    if (!segs.length) return 'Início';
    const moduleMap: Record<string, string> = {
      'doc-flow': 'DocFlow',
      'release-orchestrator': 'Release Orchestrator',
      seguranca: 'Segurança',
    };
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
    partes.push(moduleMap[segs[0]] ?? segs[0]);
    // pular IDs (UUIDs ou hashes longos)
    const isId = (s: string) => /^[0-9a-f]{8,}/i.test(s) || /^\d+$/.test(s);
    for (let i = 1; i < segs.length; i++) {
      const s = segs[i];
      if (isId(s)) continue;
      partes.push(segMap[s] ?? s);
    }
    return partes.join(' › ');
  }
}
