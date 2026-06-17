import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CardComponent, PageHeaderComponent } from '@shared/ui';
import { PermissaoDirective } from '../../directives/permissao.directive';

interface AtalhoSeguranca {
  route: string;
  icon: string;
  titulo: string;
  descricao: string;
  permissao: string;
}

@Component({
  selector: 'app-seguranca-home',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, CardComponent, PageHeaderComponent, PermissaoDirective],
  template: `
    <div class="seg-home">
      <ui-page-header
        title="Segurança"
        subtitle="Identidade, grupos, permissões e escopos de acesso."
        icon="Shield"
      />

      <div class="seg-home__grid">
        @for (a of atalhos; track a.route) {
          <ui-card *appPermissao="a.permissao" padding="md" [interactive]="true">
            <a class="seg-home__card" [routerLink]="a.route">
              <span class="seg-home__icon"><lucide-icon [name]="a.icon" [size]="20" /></span>
              <div>
                <strong>{{ a.titulo }}</strong>
                <p>{{ a.descricao }}</p>
              </div>
            </a>
          </ui-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .seg-home {
        padding: 28px 32px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .seg-home__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 14px;
      }
      .seg-home__card {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        text-decoration: none;
        color: inherit;
      }
      .seg-home__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: var(--radius);
        background: color-mix(in srgb, var(--accent) 14%, var(--surface));
        color: var(--accent);
      }
      .seg-home__card strong {
        font: 600 14px var(--font-body);
        color: var(--text);
      }
      .seg-home__card p {
        margin: 4px 0 0;
        font: 400 12.5px var(--font-body);
        color: var(--text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegurancaHomeComponent {
  protected readonly atalhos: AtalhoSeguranca[] = [
    {
      route: 'usuarios',
      icon: 'Users',
      titulo: 'Usuários',
      descricao: 'Cadastro, vínculos com grupos, ativação e reset de senha.',
      permissao: 'USUARIO:LER',
    },
    {
      route: 'grupos',
      icon: 'Network',
      titulo: 'Grupos de acesso',
      descricao: 'Permissões agrupadas por papel.',
      permissao: 'GRUPO_ACESSO:LER',
    },
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
      descricao: 'Limites por cliente, ambiente, produto.',
      permissao: 'ESCOPO:LER',
    },
    {
      route: 'historico-login',
      icon: 'ClipboardCheck',
      titulo: 'Histórico de login',
      descricao: 'Auditoria de tentativas de acesso.',
      permissao: 'HISTORICO_LOGIN:VISUALIZAR',
    },
    {
      route: 'auditoria',
      icon: 'ShieldCheck',
      titulo: 'Auditoria de segurança',
      descricao: 'Rastro imutável de alterações sensíveis.',
      permissao: 'AUDITORIA:VISUALIZAR',
    },
    {
      route: 'politica-senha',
      icon: 'KeyRound',
      titulo: 'Política de senha',
      descricao: 'Regras de composição, expiração e histórico.',
      permissao: 'POLITICA_SENHA:EDITAR',
    },
    {
      route: 'sessoes',
      icon: 'Network',
      titulo: 'Sessões ativas',
      descricao: 'Acessos abertos e revogação manual.',
      permissao: 'SESSAO:LER',
    },
    {
      route: 'acessos-temporarios',
      icon: 'Clock',
      titulo: 'Acessos temporários',
      descricao: 'Concessões com validade definida e revogação.',
      permissao: 'ACESSO_TEMPORARIO:LER',
    },
  ];
}
