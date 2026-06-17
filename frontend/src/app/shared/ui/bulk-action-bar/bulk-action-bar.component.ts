import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'ui-bulk-action-bar',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    @if (count() > 0) {
      <div class="ui-bulk" role="region" aria-label="Ações em lote">
        <span class="ui-bulk__count"
          >{{ count() }} {{ count() === 1 ? labelSingular() : labelPlural() }}</span
        >
        <ng-content />
        <ui-button variant="ghost" size="sm" icon="X" (clicked)="limpar.emit()">
          {{ limparLabel() }}
        </ui-button>
      </div>
    }
  `,
  styleUrl: './bulk-action-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkActionBarComponent {
  readonly count = input.required<number>();
  readonly labelSingular = input<string>('selecionada');
  readonly labelPlural = input<string>('selecionadas');
  readonly limparLabel = input<string>('Limpar seleção');

  readonly limpar = output<void>();
}
