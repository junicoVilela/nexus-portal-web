import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Realça (`<mark>`) ocorrências de `termo` dentro de `texto`. Case-insensitive.
 * Escapa HTML do termo para evitar injeção.
 */
@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(texto: string | null | undefined, termo: string | null | undefined): SafeHtml {
    const t = (texto ?? '').toString();
    const q = (termo ?? '').trim();
    if (!q) return this.sanitizer.bypassSecurityTrustHtml(this.escape(t));
    const esc = this.escape(t);
    const escTermo = this.escape(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const html = esc.replace(new RegExp(`(${escTermo})`, 'gi'), '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
