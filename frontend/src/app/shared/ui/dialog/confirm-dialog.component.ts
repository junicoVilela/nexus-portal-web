import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
  variant?: 'primary' | 'danger';
  icon?: string;
}

@Component({
  selector: 'ui-confirm-dialog',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly data: ConfirmDialogData = inject(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected accept(): void {
    this.ref.close(true);
  }
  protected reject(): void {
    this.ref.close(false);
  }
}
