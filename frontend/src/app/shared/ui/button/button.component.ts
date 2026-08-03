import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Variantes do sistema de botões:
 * - primary: índigo sólido — CTA (Nova, Salvar, Gerar) — máx. 1 por bloco
 * - secondary: soft índigo — Editar, Baixar, filtrar, ações de linha
 * - ghost: quiet slate — Voltar, Cancelar, Limpar, Imprimir
 * - danger: vermelho — Excluir / destrutiva
 * - menu / danger-soft: itens de dropdown
 * - amber / neutral: aliases de secondary / ghost (compat)
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'amber'
  | 'neutral'
  | 'danger'
  | 'menu'
  | 'danger-soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-btn-host--full]': 'fullWidth()',
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly icon = input<string | null>(null);
  readonly iconPosition = input<'leading' | 'trailing'>('leading');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly fullWidth = input(false);

  readonly clicked = output<void>();

  protected onClick(): void {
    if (this.disabled() || this.loading()) return;
    this.clicked.emit();
  }
}
