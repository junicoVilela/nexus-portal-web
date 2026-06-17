import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

export interface ShortcutEvent {
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
  source: HTMLElement | null;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Diretiva genérica que dispara o evento `shortcut` para teclas relevantes.
 * Ignora quando o foco está em um campo editável (exceto Ctrl+S / Esc).
 *
 * Uso:
 * ```
 * <div appShortcuts (shortcut)="onShortcut($event)">...</div>
 * ```
 */
@Directive({
  selector: '[appShortcuts]',
  standalone: true,
})
export class ShortcutsDirective {
  @Output() readonly shortcut = new EventEmitter<ShortcutEvent>();

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const dentroDeEditavel = !!target && (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable);
    const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
    const isEscape = event.key === 'Escape';
    if (dentroDeEditavel && !isSave && !isEscape) return;
    this.shortcut.emit({
      key: event.key,
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
      source: target,
    });
  }
}
