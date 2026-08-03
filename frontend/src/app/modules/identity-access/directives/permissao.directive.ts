import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';

/**
 * `*appPermissao="'USUARIO:CRIAR'"` — renderiza filhos só se usuário tem.
 *
 * Aceita uma string única, ou um array; com array, exige **todas** (AND).
 * Para "tem ao menos uma" use `appPermissaoOu="['A', 'B']"`.
 */
@Directive({
  selector: '[appPermissao]',
  standalone: true,
})
export class PermissaoDirective {
  private readonly auth = inject(AuthService);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vc = inject(ViewContainerRef);

  readonly appPermissao = input.required<string | string[]>();
  readonly appPermissaoOu = input<string[]>([]);

  private rendered = false;

  constructor() {
    effect(() => {
      const todas = (() => {
        const v = this.appPermissao();
        return Array.isArray(v) ? v : [v];
      })();
      const ou = this.appPermissaoOu();
      const tem = this.auth.tem();
      const ok = todas.every(p => tem(p)) && (ou.length === 0 || ou.some(p => tem(p)));

      if (ok && !this.rendered) {
        this.vc.createEmbeddedView(this.tpl);
        this.rendered = true;
      } else if (!ok && this.rendered) {
        this.vc.clear();
        this.rendered = false;
      }
    });
  }
}
