import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { NotificationService } from './notification.service';

@Component({
  selector: 'ui-notification-center',
  standalone: true,
  imports: [LucideAngularModule, IconButtonComponent],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent {
  private readonly router = inject(Router);
  protected readonly svc = inject(NotificationService);

  protected readonly open = signal(false);
  protected readonly hasItems = computed(() => this.svc.items().length > 0);

  protected toggle(): void {
    this.open.update(v => !v);
    if (this.open() && this.svc.unreadCount() > 0) {
      setTimeout(() => this.svc.markAllRead(), 800);
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected abrir(id: string, href?: string): void {
    this.svc.markRead(id);
    if (href) {
      this.close();
      this.router.navigateByUrl(href);
    }
  }
}
