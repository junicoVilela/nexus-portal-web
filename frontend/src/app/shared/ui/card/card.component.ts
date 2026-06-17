import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardPadding = 'sm' | 'md' | 'lg' | 'none';

@Component({
  selector: 'ui-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly padding = input<CardPadding>('md');
  readonly interactive = input(false);
}
