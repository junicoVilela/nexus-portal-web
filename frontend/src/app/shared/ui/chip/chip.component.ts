import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type ChipTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger';

@Component({
  selector: 'ui-chip',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  readonly tone = input<ChipTone>('neutral');
  readonly removable = input(false);

  readonly removed = output<void>();
}
