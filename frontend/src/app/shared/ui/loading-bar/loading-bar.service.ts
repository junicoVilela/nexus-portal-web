import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingBarService {
  private pending = 0;
  readonly active = signal(false);

  start(): void {
    this.pending++;
    if (!this.active()) this.active.set(true);
  }

  end(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) this.active.set(false);
  }
}
