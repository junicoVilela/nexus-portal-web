import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-audit-stamp',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './audit-stamp.component.html',
  styleUrl: './audit-stamp.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStampComponent {
  readonly user = input<string | undefined>(undefined);
  readonly date = input<string | undefined>(undefined);

  readonly displayUser = computed(() => this.user()?.trim() || 'system');
}
