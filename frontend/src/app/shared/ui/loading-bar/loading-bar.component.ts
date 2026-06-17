import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingBarService } from './loading-bar.service';

@Component({
  selector: 'ui-loading-bar',
  standalone: true,
  template: `<div class="ui-loading-bar" [class.ui-loading-bar--active]="active()" aria-hidden="true"></div>`,
  styleUrl: './loading-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  protected readonly active = inject(LoadingBarService).active;
}
