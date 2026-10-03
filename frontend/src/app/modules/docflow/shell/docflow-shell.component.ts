import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/auth/services/auth.service';
import { CommandPaletteService } from '@shared/ui';
import { AjudaContextualComponent } from '../components/ajuda-contextual/ajuda-contextual.component';
import { AiFeatureService } from '../services/ai-feature.service';

interface DocFlowNavItem {
  helpId: string;
  label: string;
  icon: string;
  route: string[];
  exact?: boolean;
  permissao?: string;
  requerAi?: boolean;
}

@Component({
  selector: 'app-docflow-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, AjudaContextualComponent],
  templateUrl: './docflow-shell.component.html',
  styleUrl: './docflow-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocflowShellComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly palette = inject(CommandPaletteService);
  private readonly aiFeature = inject(AiFeatureService);

  private readonly navItemsTodos: DocFlowNavItem[] = [
    { helpId: 'dashboard', label: 'Dashboard', icon: 'BarChart2', route: ['/doc-flow'], exact: true },
    {
      helpId: 'clientes',
      label: 'Clientes',
      icon: 'Building2',
      route: ['/doc-flow', 'clientes'],
      permissao: 'CLIENTE:LER',
    },
    {
      helpId: 'projetos',
      label: 'Projetos',
      icon: 'FolderOpen',
      route: ['/doc-flow', 'projetos'],
      permissao: 'PROJETO:LER',
    },
    {
      helpId: 'modulos',
      label: 'Módulos',
      icon: 'Layers',
      route: ['/doc-flow', 'modulos'],
      permissao: 'MODULO:LER',
    },
    {
      helpId: 'paginas',
      label: 'Páginas',
      icon: 'FileText',
      route: ['/doc-flow', 'paginas'],
      permissao: 'PAGINA:LER',
    },
    {
      helpId: 'assistente',
      label: 'Assistente IA',
      icon: 'Sparkles',
      route: ['/doc-flow', 'assistente'],
      permissao: 'PAGINA:CRIAR',
      requerAi: true,
    },
    {
      helpId: 'ia-qualidade',
      label: 'Qualidade da IA',
      icon: 'BarChart2',
      route: ['/doc-flow', 'ia-qualidade'],
      permissao: 'AUDITORIA:VISUALIZAR',
      requerAi: true,
    },
    {
      helpId: 'revisoes',
      label: 'Revisões',
      icon: 'ClipboardCheck',
      route: ['/doc-flow', 'revisoes'],
      permissao: 'PAGINA:LER',
    },
    {
      helpId: 'trechos',
      label: 'Trechos',
      icon: 'Blocks',
      route: ['/doc-flow', 'trechos'],
      permissao: 'PAGINA:LER',
    },
    {
      helpId: 'midias',
      label: 'Mídia',
      icon: 'Image',
      route: ['/doc-flow', 'midias'],
      permissao: 'PAGINA:LER',
    },
    {
      label: 'Publicações',
      helpId: 'publicacoes',
      icon: 'CloudUpload',
      route: ['/doc-flow', 'publicacoes'],
      permissao: 'PUBLICACAO:LER',
    },
    {
      label: 'Configurações',
      helpId: 'configuracoes',
      icon: 'Settings',
      route: ['/doc-flow', 'configuracoes'],
      permissao: 'CONFIGURACAO:EDITAR',
    },
    {
      helpId: 'ajuda',
      label: 'Ajuda',
      icon: 'HelpCircle',
      route: ['/doc-flow', 'ajuda'],
      permissao: 'AJUDA:LER',
    },
  ];

  /** Menu filtrado pelas permissões do usuário autenticado. */
  protected readonly navItems = computed<DocFlowNavItem[]>(() => {
    const tem = this.auth.tem();
    const aiOn = this.aiFeature.disponivel() || !this.aiFeature.ready();
    return this.navItemsTodos.filter(
      item => (!item.permissao || tem(item.permissao)) && (!item.requerAi || aiOn),
    );
  });

  ngOnInit(): void {
    this.aiFeature.ensureLoaded();
    this.palette.registerMany('doc-flow', [
      { id: 'df:dashboard', label: 'DocFlow — Dashboard', group: 'DocFlow', route: '/doc-flow' },
      { id: 'df:clientes', label: 'DocFlow — Clientes', group: 'DocFlow', route: '/doc-flow/clientes' },
      { id: 'df:projetos', label: 'DocFlow — Projetos', group: 'DocFlow', route: '/doc-flow/projetos' },
      { id: 'df:modulos', label: 'DocFlow — Módulos', group: 'DocFlow', route: '/doc-flow/modulos' },
      { id: 'df:paginas', label: 'DocFlow — Páginas', group: 'DocFlow', route: '/doc-flow/paginas' },
      {
        id: 'df:assistente',
        label: 'DocFlow — Assistente IA',
        group: 'DocFlow',
        route: '/doc-flow/assistente',
      },
      {
        id: 'df:ia-qualidade',
        label: 'DocFlow — Qualidade da IA',
        group: 'DocFlow',
        route: '/doc-flow/ia-qualidade',
      },
      {
        id: 'df:revisoes',
        label: 'DocFlow — Central de revisão',
        group: 'DocFlow',
        route: '/doc-flow/revisoes',
      },
      {
        id: 'df:trechos',
        label: 'DocFlow — Trechos reutilizáveis',
        group: 'DocFlow',
        route: '/doc-flow/trechos',
      },
      {
        id: 'df:midias',
        label: 'DocFlow — Biblioteca de mídia',
        group: 'DocFlow',
        route: '/doc-flow/midias',
      },
      {
        id: 'df:publicacoes',
        label: 'DocFlow — Publicações',
        group: 'DocFlow',
        route: '/doc-flow/publicacoes',
      },
      { id: 'df:busca', label: 'DocFlow — Busca global', group: 'DocFlow', route: '/doc-flow/busca' },
      {
        id: 'df:configuracoes',
        label: 'DocFlow — Configurações',
        group: 'DocFlow',
        route: '/doc-flow/configuracoes',
      },
      { id: 'df:ajuda', label: 'DocFlow — Central de ajuda', group: 'DocFlow', route: '/doc-flow/ajuda' },
    ]);
  }

  ngOnDestroy(): void {
    this.palette.unregister('doc-flow');
  }
}
