import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EmptyStateComponent, ErrorStateComponent, ErrorVariant, PageHeaderComponent } from '@shared/ui';
import type { EmptyIllustration } from '@shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'ui-list-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent, ErrorStateComponent],
  templateUrl: './list-page.component.html',
  styleUrl: './list-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly loading = input(false);
  readonly isEmpty = input(false);

  readonly error = input<string | null>(null);
  readonly errorVariant = input<ErrorVariant>('generic');
  readonly showRetry = input(true);

  readonly emptyTitle = input<string>('Sem registros');
  readonly emptyDescription = input<string | null>(null);
  readonly emptyIllustration = input<EmptyIllustration>('list');
  readonly emptyIcon = input<string>('Inbox');

  readonly retry = output<void>();
}
