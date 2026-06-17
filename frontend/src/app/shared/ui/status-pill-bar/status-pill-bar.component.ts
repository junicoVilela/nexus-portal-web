import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface StatusPillItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

@Component({
  selector: 'ui-status-pill-bar',
  standalone: true,
  templateUrl: './status-pill-bar.component.html',
  styleUrl: './status-pill-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPillBarComponent<T extends string = string> {
  readonly items = input.required<StatusPillItem<T>[]>();
  readonly value = input.required<T | ''>();
  readonly todosLabel = input<string>('Todos');
  readonly todosCount = input<number | null>(null);

  readonly selecionar = output<T | ''>();
}
