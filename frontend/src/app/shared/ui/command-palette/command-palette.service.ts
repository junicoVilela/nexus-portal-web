import { Injectable, computed, signal } from '@angular/core';

export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  route?: string;
  action?: () => void;
}

const LEGACY_NS = '_legacy';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly _open = signal(false);
  private readonly _ns = signal<Record<string, PaletteCommand[]>>({});
  readonly query = signal<string>('');

  readonly isOpen = this._open.asReadonly();
  readonly results = computed<PaletteCommand[]>(() => {
    const q = this.query().toLowerCase().trim();
    const all = Object.values(this._ns()).flat();
    if (!q) return all;
    return all.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  });

  /** Replaces commands for the given namespace. Other namespaces are untouched. */
  registerMany(namespace: string, cmds: PaletteCommand[]): void {
    this._ns.update(prev => ({ ...prev, [namespace]: cmds }));
  }

  /** Removes all commands registered under the given namespace. */
  unregister(namespace: string): void {
    this._ns.update(prev => {
      const next = { ...prev };
      delete next[namespace];
      return next;
    });
  }

  /** Legacy API — equivalent to `registerMany('_legacy', cmds)`. Kept for back-compat. */
  register(cmds: PaletteCommand[]): void {
    this.registerMany(LEGACY_NS, cmds);
  }

  open(): void {
    this._open.set(true);
  }
  close(): void {
    this.query.set('');
    this._open.set(false);
  }
  toggle(): void {
    this._open() ? this.close() : this.open();
  }
}
