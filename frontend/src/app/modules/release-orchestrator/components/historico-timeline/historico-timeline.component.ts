import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BadgeComponent } from '@shared/ui';
import {
  ACAO_HISTORICO_ICONES_LUCIDE,
  ACAO_HISTORICO_LABELS,
  ACAO_HISTORICO_TONS,
  ReleaseHistorico,
} from '../../models/release-historico.model';
import { RELEASE_STATUS_LABELS, ReleaseStatus } from '../../models/release.model';

type StatusTone = 'success' | 'warn' | 'danger' | 'neutral';

const STATUS_TONES: Record<string, StatusTone> = {
  RASCUNHO: 'neutral',
  EM_DESENVOLVIMENTO: 'neutral',
  EM_REVISAO: 'warn',
  APROVADA: 'success',
  PUBLICADA: 'success',
  CANCELADA: 'danger',
};

@Component({
  selector: 'app-historico-timeline',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, BadgeComponent],
  templateUrl: './historico-timeline.component.html',
  styleUrl: './historico-timeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoTimelineComponent {
  readonly historico = input.required<ReleaseHistorico[]>();

  protected readonly acaoLabels = ACAO_HISTORICO_LABELS;
  protected readonly acaoIconesLucide = ACAO_HISTORICO_ICONES_LUCIDE;
  protected readonly acaoTons = ACAO_HISTORICO_TONS;

  protected getStatusLabel(status: string): string {
    return RELEASE_STATUS_LABELS[status as ReleaseStatus] ?? status;
  }
  protected getStatusTone(status: string): StatusTone {
    return STATUS_TONES[status] ?? 'neutral';
  }
}
