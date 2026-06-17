import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ui-offline-banner',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (!online()) {
      <div class="ui-offline" role="status" aria-live="assertive">
        <lucide-icon name="X" [size]="14" />
        <span i18n="@@ui.offlineBanner.message"
          >Você está offline. As ações que dependem de rede ficarão suspensas.</span
        >
      </div>
    }
  `,
  styleUrl: './offline-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineBannerComponent {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly online = signal(navigator.onLine);

  constructor() {
    merge(fromEvent(window, 'online'), fromEvent(window, 'offline'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.online.set(navigator.onLine));
  }
}
