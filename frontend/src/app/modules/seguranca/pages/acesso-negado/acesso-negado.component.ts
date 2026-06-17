import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-acesso-negado',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, ButtonComponent],
  template: `
    <div class="acesso-negado">
      <div class="acesso-negado__icon">
        <lucide-icon name="Lock" [size]="32" />
      </div>
      <h1>Acesso negado</h1>
      <p>
        Você não tem permissão para acessar esta área. Procure um administrador para verificar suas permissões
        ou volte para uma área permitida.
      </p>
      <div class="acesso-negado__actions">
        <ui-button variant="ghost" icon="ArrowLeft" (clicked)="voltar()">Voltar</ui-button>
        <ui-button icon="House" routerLink="/">Ir para Início</ui-button>
      </div>
    </div>
  `,
  styles: [
    `
      .acesso-negado {
        max-width: 480px;
        margin: 80px auto;
        text-align: center;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }
      .acesso-negado__icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--danger) 14%, var(--surface));
        color: var(--danger);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      h1 {
        font: 700 22px/1.2 var(--font-display);
        margin: 0;
      }
      p {
        color: var(--text-muted);
        font: 400 13.5px/1.5 var(--font-body);
        margin: 0;
      }
      .acesso-negado__actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcessoNegadoComponent {
  private readonly location = inject(Location);

  protected voltar(): void {
    this.location.back();
  }
}
