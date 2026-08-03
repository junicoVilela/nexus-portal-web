import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';

const MENU_MIN_WIDTH = 220;

@Component({
  selector: 'ui-more-actions',
  standalone: true,
  template: `
    <button
      #trigger
      type="button"
      class="ui-more-actions__trigger"
      [class.ui-more-actions__trigger--compact]="compact()"
      [attr.aria-expanded]="aberto()"
      aria-haspopup="menu"
      [attr.aria-label]="label()"
      [attr.title]="compact() ? label() : null"
      (click)="alternar($event)"
    >
      @if (compact()) {
        <span class="ui-more-actions__dots" aria-hidden="true"></span>
      } @else {
        {{ label() }}
      }
    </button>
    <div
      #menu
      class="ui-more-actions__menu ui-dropdown-panel"
      role="menu"
      [class.ui-more-actions__menu--open]="aberto()"
      [style.top.px]="menuTop()"
      [style.left.px]="menuLeft()"
      [style.transformOrigin]="menuOrigin()"
      (click)="aoClicarMenu()"
    >
      <ng-content />
    </div>
  `,
  host: {
    class: 'ui-more-actions',
    '[class.ui-more-actions--open]': 'aberto()',
    '[class.ui-more-actions--compact]': 'compact()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoreActionsComponent {
  private static readonly abertos = new Set<MoreActionsComponent>();
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuRef = viewChild<ElementRef<HTMLElement>>('menu');

  /** Texto do botão (e aria-label no modo compacto). */
  readonly label = input('Mais ações');
  /** Trigger só com reticências — uso em grades/tabelas. */
  readonly compact = input(false);

  protected readonly aberto = signal(false);
  protected readonly menuTop = signal(0);
  protected readonly menuLeft = signal(0);
  protected readonly menuOrigin = signal('top right');

  private readonly aoScrollCapturado = (): void => {
    if (this.aberto()) this.fechar(false);
  };

  constructor() {
    document.addEventListener('scroll', this.aoScrollCapturado, true);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('scroll', this.aoScrollCapturado, true);
      MoreActionsComponent.abertos.delete(this);
    });
  }

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

  @HostListener('window:resize')
  protected aoRedimensionar(): void {
    if (this.aberto()) this.posicionarMenu();
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
    this.cdr.detectChanges();
    this.posicionarMenu();
    this.focarPrimeiroItem();

    afterNextRender(
      () => {
        if (!this.aberto()) return;
        this.posicionarMenu();
        this.focarPrimeiroItem();
      },
      { injector: this.injector },
    );
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

  private posicionarMenu(): void {
    const trigger = this.triggerRef()?.nativeElement;
    const menu = this.menuRef()?.nativeElement;
    if (!trigger || !menu) return;

    const gap = 6;
    const margin = 8;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(menu.offsetWidth || MENU_MIN_WIDTH, MENU_MIN_WIDTH);
    const menuHeight = menu.offsetHeight || 0;

    let top = rect.bottom + gap;
    let originY = 'top';
    if (menuHeight > 0 && top + menuHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - gap - menuHeight);
      originY = 'bottom';
    }

    let left = rect.right - menuWidth;
    let originX = 'right';
    if (left < margin) {
      left = Math.min(rect.left, window.innerWidth - margin - menuWidth);
      originX = 'left';
    }
    left = Math.min(left, window.innerWidth - margin - menuWidth);
    left = Math.max(margin, left);

    this.menuOrigin.set(`${originY} ${originX}`);
    this.menuTop.set(Math.round(top));
    this.menuLeft.set(Math.round(left));
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
