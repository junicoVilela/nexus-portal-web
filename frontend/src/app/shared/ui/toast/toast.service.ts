import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warn' | 'info';

export interface Toast {
  id: number;
  variant: ToastVariant;
  title?: string;
  message: string;
  sticky?: boolean;
  createdAt: number;
}

interface ToastOptions {
  title?: string;
  sticky?: boolean;
  durationMs?: number;
}

import { TIMINGS } from '@core/config/timings';

const DEFAULT_DURATION: Record<ToastVariant, number> = TIMINGS.toast;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string, opts: ToastOptions = {}): void {
    this.push('success', message, opts);
  }
  error(message: string, opts: ToastOptions = {}): void {
    this.push('error', message, opts);
  }
  warn(message: string, opts: ToastOptions = {}): void {
    this.push('warn', message, opts);
  }
  info(message: string, opts: ToastOptions = {}): void {
    this.push('info', message, opts);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(variant: ToastVariant, message: string, opts: ToastOptions): void {
    const toast: Toast = {
      id: this.nextId++,
      variant,
      title: opts.title,
      message,
      sticky: opts.sticky ?? false,
      createdAt: Date.now(),
    };
    this.toasts.update(list => [...list, toast]);
    if (!toast.sticky) {
      const duration = opts.durationMs ?? DEFAULT_DURATION[variant];
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }
}
