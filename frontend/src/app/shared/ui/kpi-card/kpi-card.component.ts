import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type KpiTone = 'neutral' | 'green' | 'blue' | 'amber' | 'purple' | 'red';

@Component({
  selector: 'ui-kpi-card',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly valor = input.required<number | string>();
  readonly icon = input<string | null>(null);
  readonly tone = input<KpiTone>('neutral');
  readonly description = input<string | null>(null);
}
