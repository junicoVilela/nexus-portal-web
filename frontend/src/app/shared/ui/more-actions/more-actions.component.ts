import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'ui-more-actions',
  standalone: true,
  template: `
    <button
      #trigger
      type="button"
      class="ui-more-actions__trigger"
      [attr.aria-expanded]="aberto()"
      aria-haspopup="menu"
      aria-label="Mais ações"
      (click)="alternar($event)"
    >
      Mais ações
    </button>
    @if (aberto()) {
      <div #menu class="ui-more-actions__menu" role="menu" (click)="aoClicarMenu()">
        <ng-content />
      </div>
    }
  `,
  host: {
    class: 'ui-more-actions',
    '[class.ui-more-actions--open]': 'aberto()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoreActionsComponent {
  private static readonly abertos = new Set<MoreActionsComponent>();
  private readonly host = inject(ElementRef<HTMLElement>);

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuRef = viewChild<ElementRef<HTMLElement>>('menu');

  protected readonly aberto = signal(false);

  @HostListener('document:keydown', ['$event'])
  protected fecharPorEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.aberto()) return;
    event.preventDefault();
    event.stopPropagation();
    this.fechar(true);
  }

  @HostListener('document:click', ['$event'])
  protected fecharPorCliqueExterno(event: MouseEvent): void {
    if (!this.aberto()) return;
    const alvo = event.target as Node | null;
    if (alvo && this.host.nativeElement.contains(alvo)) return;
    this.fechar(false);
  }

  static fecharTodos(): void {
    for (const instancia of [...MoreActionsComponent.abertos]) {
      instancia.fechar(false);
    }
  }

  protected alternar(event: MouseEvent): void {
    event.stopPropagation();
    if (this.aberto()) {
      this.fechar(true);
      return;
    }
    MoreActionsComponent.fecharTodos();
    this.aberto.set(true);
    MoreActionsComponent.abertos.add(this);
    queueMicrotask(() => this.focarPrimeiroItem());
  }

  protected aoClicarMenu(): void {
    queueMicrotask(() => this.fechar(true));
  }

  protected fechar(restaurarFoco: boolean): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    MoreActionsComponent.abertos.delete(this);
    if (restaurarFoco) {
      this.triggerRef()?.nativeElement.focus();
    }
  }

  private focarPrimeiroItem(): void {
    const menu = this.menuRef()?.nativeElement;
    if (!menu) return;
    const focavel = menu.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focavel?.focus();
  }
}
