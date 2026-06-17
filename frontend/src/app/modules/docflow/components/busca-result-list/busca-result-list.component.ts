import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CardComponent } from '@shared/ui';
import { HighlightPipe } from '@shared/utils/highlight.pipe';

export interface BuscaResultItem {
  id: string;
}

@Component({
  selector: 'app-busca-result-list',
  standalone: true,
  imports: [CardComponent, HighlightPipe],
  templateUrl: './busca-result-list.component.html',
  styleUrl: './busca-result-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscaResultListComponent<T extends BuscaResultItem = BuscaResultItem> {
  readonly titulo = input.required<string>();
  readonly subtitulo = input.required<string>();
  readonly emptyLabel = input.required<string>();
  readonly items = input.required<T[]>();
  readonly termo = input<string>('');
  readonly primaryFn = input.required<(item: T) => string>();
  readonly secondaryFn = input<(item: T) => string>(() => '');

  readonly abrir = output<T>();
}
