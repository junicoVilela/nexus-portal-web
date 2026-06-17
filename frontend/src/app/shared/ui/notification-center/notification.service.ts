import { Injectable, computed, signal } from '@angular/core';

export type NotificationLevel = 'info' | 'success' | 'warn' | 'danger';

export interface Notification {
  id: string;
  level: NotificationLevel;
  title: string;
  description?: string;
  href?: string;
  createdAt: number;
  read: boolean;
}

const STORAGE_KEY = 'notification-inbox';
const MAX_ITEMS = 50;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly items = signal<Notification[]>(this.load());
  readonly unreadCount = computed(() => this.items().filter(n => !n.read).length);

  add(level: NotificationLevel, title: string, opts: { description?: string; href?: string } = {}): void {
    const item: Notification = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      title,
      description: opts.description,
      href: opts.href,
      createdAt: Date.now(),
      read: false,
    };
    this.items.update(list => [item, ...list].slice(0, MAX_ITEMS));
    this.persist();
  }

  markRead(id: string): void {
    this.items.update(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
    this.persist();
  }

  markAllRead(): void {
    this.items.update(list => list.map(n => ({ ...n, read: true })));
    this.persist();
  }

  remove(id: string): void {
    this.items.update(list => list.filter(n => n.id !== id));
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  private load(): Notification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Notification[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    } catch {
      /* storage full */
    }
  }
}
