import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BadgeComponent, CardComponent, PageHeaderComponent } from '@shared/ui';
import { PermissaoDirective } from '../../directives/permissao.directive';

interface AtalhoSeguranca {
  route: string;
  icon: string;
  titulo: string;
  descricao: string;
  permissao: string;
}

interface CategoriaSeguranca {
  id: 'identidades' | 'governanca' | 'monitoramento';
  titulo: string;
  descricao: string;
  icon: string;
  atalhos: readonly AtalhoSeguranca[];
}

@Component({
  selector: 'app-seguranca-home',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    BadgeComponent,
    CardComponent,
    PageHeaderComponent,
    PermissaoDirective,
  ],
  templateUrl: './seguranca-home.component.html',
  styleUrl: './seguranca-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegurancaHomeComponent {
  protected readonly categorias: readonly CategoriaSeguranca[] = [
    {
      id: 'identidades',
      titulo: 'Identidades e acessos',
      descricao: 'Administre pessoas, papéis e concessões de acesso.',
      icon: 'UsersRound',
      atalhos: [
        {
          route: 'usuarios',
          icon: 'Users',
          titulo: 'Usuários',
          descricao: 'Cadastro, vínculos com grupos, ativação e redefinição de senha.',
          permissao: 'USUARIO:LER',
        },
        {
          route: 'grupos',
          icon: 'Network',
          titulo: 'Grupos de acesso',
          descricao: 'Organize permissões por papel e responsabilidade.',
          permissao: 'GRUPO_ACESSO:LER',
        },
        {
          route: 'acessos-temporarios',
          icon: 'Clock',
          titulo: 'Acessos temporários',
          descricao: 'Concessões com prazo definido e revogação controlada.',
          permissao: 'ACESSO_TEMPORARIO:LER',
        },
      ],
    },
    {
      id: 'governanca',
      titulo: 'Governança e políticas',
      descricao: 'Defina as regras que orientam e limitam o acesso.',
      icon: 'SlidersHorizontal',
      atalhos: [
        {
          route: 'dominios',
          icon: 'Layers',
          titulo: 'Domínios e permissões',
          descricao: 'Catálogo hierárquico de funcionalidades e permissões.',
          permissao: 'DOMINIO:LER',
        },
        {
          route: 'escopo-acesso',
          icon: 'Lock',
          titulo: 'Escopo de acesso',
          descricao: 'Delimite acessos por cliente, ambiente e produto.',
          permissao: 'ESCOPO:LER',
        },
        {
          route: 'politica-senha',
          icon: 'KeyRound',
          titulo: 'Política de senha',
          descricao: 'Configure composição, expiração e histórico de senhas.',
          permissao: 'POLITICA_SENHA:EDITAR',
        },
      ],
    },
    {
      id: 'monitoramento',
      titulo: 'Monitoramento e auditoria',
      descricao: 'Acompanhe sessões, tentativas e mudanças sensíveis.',
      icon: 'Activity',
      atalhos: [
        {
          route: 'historico-login',
          icon: 'ClipboardCheck',
          titulo: 'Histórico de login',
          descricao: 'Consulte tentativas de acesso e seus resultados.',
          permissao: 'HISTORICO_LOGIN:VISUALIZAR',
        },
        {
          route: 'auditoria',
          icon: 'ShieldCheck',
          titulo: 'Auditoria de segurança',
          descricao: 'Investigue o registro de alterações sensíveis.',
          permissao: 'AUDITORIA:VISUALIZAR',
        },
        {
          route: 'sessoes',
          icon: 'MonitorSmartphone',
          titulo: 'Sessões ativas',
          descricao: 'Visualize acessos abertos e faça revogações manuais.',
          permissao: 'SESSAO:LER',
        },
      ],
    },
  ];
}
