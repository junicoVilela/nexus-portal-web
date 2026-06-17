import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent, BadgeTone } from '@shared/ui';
import { StatusPagina } from '@modules/docflow/models/pagina.model';

interface StatusVisual {
  tone: BadgeTone;
  label: string;
}

const STATUS_MAP: Record<StatusPagina, StatusVisual> = {
  RASCUNHO: { tone: 'neutral', label: 'Rascunho' },
  EM_REVISAO: { tone: 'warn', label: 'Em revisão' },
  APROVADO: { tone: 'info', label: 'Aprovado' },
  PUBLICADO: { tone: 'success', label: 'Publicado' },
  ARQUIVADO: { tone: 'danger', label: 'Arquivado' },
};

@Component({
  selector: 'app-pagina-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `<ui-badge [tone]="visual().tone" [dot]="true">{{ visual().label }}</ui-badge>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaStatusBadgeComponent {
  readonly status = input.required<StatusPagina>();

  protected readonly visual = computed<StatusVisual>(
    () => STATUS_MAP[this.status()] ?? { tone: 'neutral', label: this.status() },
  );
}
