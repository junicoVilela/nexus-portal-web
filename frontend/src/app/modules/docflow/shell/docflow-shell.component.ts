import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { CommandPaletteService } from '@shared/ui';

interface DocFlowNavItem {
  label: string;
  icon: string;
  route: string[];
  exact?: boolean;
  permissao?: string;
}

@Component({
  selector: 'app-docflow-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './docflow-shell.component.html',
  styleUrl: './docflow-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocflowShellComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly palette = inject(CommandPaletteService);

  private readonly navItemsTodos: DocFlowNavItem[] = [
    { label: 'Dashboard', icon: 'BarChart2', route: ['/doc-flow'], exact: true },
    { label: 'Clientes', icon: 'Building2', route: ['/doc-flow', 'clientes'], permissao: 'CLIENTE:LER' },
    { label: 'Projetos', icon: 'FolderOpen', route: ['/doc-flow', 'projetos'], permissao: 'PROJETO:LER' },
    { label: 'Módulos', icon: 'Layers', route: ['/doc-flow', 'modulos'], permissao: 'MODULO:LER' },
    { label: 'Páginas', icon: 'FileText', route: ['/doc-flow', 'paginas'], permissao: 'PAGINA:LER' },
    {
      label: 'Publicações',
      icon: 'CloudUpload',
      route: ['/doc-flow', 'publicacoes'],
      permissao: 'PUBLICACAO:LER',
    },
    {
      label: 'Configurações',
      icon: 'Settings',
      route: ['/doc-flow', 'configuracoes'],
      permissao: 'CONFIGURACAO:EDITAR',
    },
  ];

  /** Menu filtrado pelas permissões do usuário autenticado. */
  protected readonly navItems = computed<DocFlowNavItem[]>(() => {
    const tem = this.auth.tem();
    return this.navItemsTodos.filter(item => !item.permissao || tem(item.permissao));
  });

  ngOnInit(): void {
    this.palette.registerMany('doc-flow', [
      { id: 'df:dashboard', label: 'Doc Flow — Dashboard', group: 'Doc Flow', route: '/doc-flow' },
      { id: 'df:clientes', label: 'Doc Flow — Clientes', group: 'Doc Flow', route: '/doc-flow/clientes' },
      { id: 'df:projetos', label: 'Doc Flow — Projetos', group: 'Doc Flow', route: '/doc-flow/projetos' },
      { id: 'df:modulos', label: 'Doc Flow — Módulos', group: 'Doc Flow', route: '/doc-flow/modulos' },
      { id: 'df:paginas', label: 'Doc Flow — Páginas', group: 'Doc Flow', route: '/doc-flow/paginas' },
      {
        id: 'df:publicacoes',
        label: 'Doc Flow — Publicações',
        group: 'Doc Flow',
        route: '/doc-flow/publicacoes',
      },
      { id: 'df:busca', label: 'Doc Flow — Busca global', group: 'Doc Flow', route: '/doc-flow/busca' },
      {
        id: 'df:configuracoes',
        label: 'Doc Flow — Configurações',
        group: 'Doc Flow',
        route: '/doc-flow/configuracoes',
      },
    ]);
  }

  ngOnDestroy(): void {
    this.palette.unregister('doc-flow');
  }
}
