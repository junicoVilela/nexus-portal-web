import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed-at';
const RE_SHOW_AFTER_DAYS = 14;

@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private readonly destroyRef = inject(DestroyRef);
  private deferred: BeforeInstallPromptEvent | null = null;

  readonly available = signal(false);
  readonly installing = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;
    fromEvent<Event>(window, 'beforeinstallprompt')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(evt => {
        evt.preventDefault();
        this.deferred = evt as BeforeInstallPromptEvent;
        if (!this.recentementeDispensado()) this.available.set(true);
      });
    fromEvent<Event>(window, 'appinstalled')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.deferred = null;
        this.available.set(false);
      });
  }

  async install(): Promise<void> {
    if (!this.deferred) return;
    this.installing.set(true);
    try {
      await this.deferred.prompt();
      const choice = await this.deferred.userChoice;
      if (choice.outcome === 'dismissed') this.snooze();
      this.deferred = null;
      this.available.set(false);
    } finally {
      this.installing.set(false);
    }
  }

  dismiss(): void {
    this.snooze();
    this.available.set(false);
  }

  private snooze(): void {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* storage indisponível */
    }
  }

  private recentementeDispensado(): boolean {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (!raw) return false;
      const elapsedMs = Date.now() - Number(raw);
      return elapsedMs < RE_SHOW_AFTER_DAYS * 86_400_000;
    } catch {
      return false;
    }
  }
}
