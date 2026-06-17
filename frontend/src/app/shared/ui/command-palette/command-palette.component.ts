import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommandPaletteService, PaletteCommand } from './command-palette.service';

@Component({
  selector: 'ui-command-palette',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  protected readonly svc = inject(CommandPaletteService);
  private readonly router = inject(Router);

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const cmdOrCtrl = e.metaKey || e.ctrlKey;
    if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.svc.toggle();
      return;
    }
    if (e.key === '/' && !this.estaEditando(e.target)) {
      e.preventDefault();
      this.svc.open();
      return;
    }
    if (this.svc.isOpen() && e.key === 'Escape') {
      e.preventDefault();
      this.svc.close();
    }
  }

  private estaEditando(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    if (el.isContentEditable) return true;
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
  }

  protected onQuery(event: Event): void {
    this.svc.query.set((event.target as HTMLInputElement).value);
  }

  protected run(cmd: PaletteCommand): void {
    if (cmd.action) cmd.action();
    if (cmd.route) this.router.navigateByUrl(cmd.route);
    this.svc.close();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.svc.close();
  }
}
