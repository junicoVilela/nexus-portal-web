import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from './toast.service';

@Component({
  selector: 'ui-toast-host',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService).toasts;
  private readonly service = inject(ToastService);

  protected readonly icons: Record<string, string> = {
    success: 'CheckCircle2',
    error: 'XCircle',
    warn: 'AlertTriangle',
    info: 'Info',
  };

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
