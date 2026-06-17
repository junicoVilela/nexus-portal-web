import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent, PageHeaderComponent } from '@shared/ui';

@Component({
  selector: 'ui-form-page',
  standalone: true,
  imports: [PageHeaderComponent, ButtonComponent],
  templateUrl: './form-page.component.html',
  styleUrl: './form-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly saving = input(false);
  readonly canSave = input(true);
  readonly saveLabel = input<string>('Salvar');
  readonly cancelLabel = input<string>('Cancelar');

  readonly saved = output<void>();
  readonly cancelled = output<void>();
}
