import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { InstallPromptService } from './install-prompt.service';

@Component({
  selector: 'ui-install-prompt',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (svc.available()) {
      <div class="ui-install" role="region" aria-label="Instalar aplicativo">
        <button
          type="button"
          class="ui-install__btn"
          (click)="svc.install()"
          [disabled]="svc.installing()"
          aria-label="Instalar aplicativo"
          title="Instalar"
        >
          <lucide-icon name="Download" [size]="14" />
          <span class="ui-install__label">Instalar</span>
        </button>
        <button
          type="button"
          class="ui-install__dismiss"
          (click)="svc.dismiss()"
          aria-label="Dispensar instalação"
          title="Dispensar"
        >
          <lucide-icon name="X" [size]="14" />
        </button>
      </div>
    }
  `,
  styles: [
    `
      .ui-install {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 2px;
      }
      .ui-install__btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: 0;
        padding: 4px 8px;
        font: 500 12.5px var(--font-body);
        color: var(--text);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: background var(--motion-default);
      }
      .ui-install__btn:hover {
        background: var(--surface);
      }
      .ui-install__btn:disabled {
        opacity: 0.6;
        cursor: progress;
      }
      .ui-install__dismiss {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: transparent;
        border: 0;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: var(--radius-sm);
      }
      .ui-install__dismiss:hover {
        color: var(--text);
        background: var(--surface);
      }
      @media (max-width: 640px) {
        .ui-install__label {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallPromptComponent {
  protected readonly svc = inject(InstallPromptService);
}
