import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { CommandPaletteService } from '@shared/ui';

interface RfNavItem {
  label: string;
  icon: string;
  route: string[];
  exact?: boolean;
  permissao?: string;
}

@Component({
  selector: 'app-release-orchestrator-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './release-orchestrator-shell.component.html',
  styleUrl: './release-orchestrator-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseOrchestratorShellComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly palette = inject(CommandPaletteService);

  private readonly navItemsTodos: RfNavItem[] = [
    { label: 'Dashboard', icon: 'House', route: ['/release-orchestrator'], exact: true },
    {
      label: 'Registrar',
      icon: 'PlayCircle',
      route: ['/release-orchestrator', 'builder'],
      permissao: 'RELEASE:CRIAR',
    },
    { label: 'Releases', icon: 'Tag', route: ['/release-orchestrator', 'releases'], permissao: 'RELEASE:LER' },
    { label: 'Produtos', icon: 'Box', route: ['/release-orchestrator', 'produtos'], permissao: 'PRODUTO:LER' },
    {
      label: 'Templates',
      icon: 'FilePen',
      route: ['/release-orchestrator', 'templates'],
      permissao: 'TEMPLATE:LER',
    },
    { label: 'Como usar', icon: 'HelpCircle', route: ['/release-orchestrator', 'guia'] },
  ];

  /** Menu filtrado pelas permissões do usuário autenticado. */
  protected readonly navItems = computed<RfNavItem[]>(() => {
    const tem = this.auth.tem();
    return this.navItemsTodos.filter(item => !item.permissao || tem(item.permissao));
  });

  ngOnInit(): void {
    this.palette.registerMany('release-orchestrator', [
      {
        id: 'rf:dashboard',
        label: 'Release Orchestrator — Dashboard',
        group: 'Release Orchestrator',
        route: '/release-orchestrator',
      },
      {
        id: 'rf:builder',
        label: 'Release Orchestrator — Registrar',
        group: 'Release Orchestrator',
        route: '/release-orchestrator/builder',
      },
      {
        id: 'rf:releases',
        label: 'Release Orchestrator — Releases',
        group: 'Release Orchestrator',
        route: '/release-orchestrator/releases',
      },
      {
        id: 'rf:produtos',
        label: 'Release Orchestrator — Produtos',
        group: 'Release Orchestrator',
        route: '/release-orchestrator/produtos',
      },
      {
        id: 'rf:templates',
        label: 'Release Orchestrator — Templates',
        group: 'Release Orchestrator',
        route: '/release-orchestrator/templates',
      },
      {
        id: 'rf:guia',
        label: 'Release Orchestrator — Como usar',
        group: 'Release Orchestrator',
        route: '/release-orchestrator/guia',
      },
    ]);
  }

  ngOnDestroy(): void {
    this.palette.unregister('release-orchestrator');
  }
}
