import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeTone } from '@shared/ui';
import { ReleaseStatus, RELEASE_STATUS_LABELS } from '../../models/release.model';

const TONES: Record<ReleaseStatus, BadgeTone> = {
  RASCUNHO: 'neutral',
  EM_DESENVOLVIMENTO: 'info',
  EM_REVISAO: 'warn',
  APROVADA: 'accent',
  PUBLICADA: 'success',
  CANCELADA: 'danger',
};

@Component({
  selector: 'app-release-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `<ui-badge [tone]="tone()" [dot]="true">{{ label() }}</ui-badge>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseStatusBadgeComponent {
  readonly status = input.required<ReleaseStatus>();

  protected readonly tone = computed<BadgeTone>(() => TONES[this.status()] ?? 'neutral');
  protected readonly label = computed(() => RELEASE_STATUS_LABELS[this.status()] ?? this.status());
}
