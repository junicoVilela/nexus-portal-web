import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="ui-tabs" role="tablist">
      @for (tab of items(); track tab.id) {
        <button
          type="button"
          role="tab"
          class="ui-tabs__btn"
          [class.ui-tabs__btn--active]="active() === tab.id"
          [class.ui-tabs__btn--disabled]="!!tab.disabled"
          [disabled]="!!tab.disabled"
          [attr.aria-selected]="active() === tab.id"
          [attr.aria-disabled]="!!tab.disabled"
          (click)="select(tab.id)"
        >
          @if (tab.icon) {
            <lucide-icon [name]="tab.icon" [size]="14" />
          }
          <span>{{ tab.label }}</span>
          @if (tab.count !== undefined) {
            <span class="ui-tabs__count">{{ tab.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styleUrl: './tabs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent<T extends string = string> {
  readonly items = input.required<TabItem<T>[]>();
  readonly active = input.required<T>();

  readonly activeChange = output<T>();

  protected select(id: T): void {
    const tab = this.items().find(t => t.id === id);
    if (!tab || tab.disabled || id === this.active()) {
      return;
    }
    this.activeChange.emit(id);
  }
}
