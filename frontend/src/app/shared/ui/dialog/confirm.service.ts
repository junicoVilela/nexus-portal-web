import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data,
      backdropClass: 'ui-dialog-backdrop',
      panelClass: 'ui-dialog-panel',
      disableClose: false,
    });
    return firstValueFrom(ref.closed).then(result => result === true);
  }
}
