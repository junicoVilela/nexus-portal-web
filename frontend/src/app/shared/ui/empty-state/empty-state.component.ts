import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type EmptyIllustration = 'inbox' | 'search' | 'list' | 'success' | 'document' | 'none';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<string>('Inbox');
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly illustration = input<EmptyIllustration>('none');
}
