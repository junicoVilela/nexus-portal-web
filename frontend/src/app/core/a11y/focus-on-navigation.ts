import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Após NavigationEnd, foca o primeiro h1 do main para que leitores de tela
 * reposicionem contexto.
 */
@Injectable({ providedIn: 'root' })
export class FocusOnNavigationService {
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  init(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      queueMicrotask(() => {
        const main = this.doc.getElementById('main-content');
        const h1 = main?.querySelector<HTMLElement>('h1');
        if (h1 && !h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
        h1?.focus({ preventScroll: false });
      });
    });
  }
}
