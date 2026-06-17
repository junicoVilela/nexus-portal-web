import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonShape = 'line' | 'block' | 'circle';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly shape = input<SkeletonShape>('line');
  readonly width = input<string>('100%');
  readonly height = input<string>('14px');
}
