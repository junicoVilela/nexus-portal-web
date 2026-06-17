import { Directive, ElementRef, effect, inject, input } from '@angular/core';

@Directive({
  selector: '[uiTooltip]',
  standalone: true,
})
export class TooltipDirective {
  readonly uiTooltip = input.required<string>();
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const v = this.uiTooltip();
      const el = this.host.nativeElement;
      el.setAttribute('title', v);
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', v);
    });
  }
}
