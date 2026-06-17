import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type IconButtonTone = 'default' | 'accent' | 'danger';
export type IconButtonSize = 'sm' | 'md';

@Component({
  selector: 'ui-icon-button',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent {
  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly tone = input<IconButtonTone>('default');
  readonly size = input<IconButtonSize>('md');
  readonly disabled = input(false);

  readonly clicked = output<void>();

  protected onClick(): void {
    if (!this.disabled()) this.clicked.emit();
  }
}
