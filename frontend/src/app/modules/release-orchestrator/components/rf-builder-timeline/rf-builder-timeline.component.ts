import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonComponent } from '@shared/ui';
import { CategoriaItem, CATEGORIA_CORES, CATEGORIA_LABELS } from '../../models/release-item.model';

export interface EntradaTimeline {
  id: string;
  categoria: CategoriaItem;
  titulo: string;
  descricao: string;
  ticket: string;
  commit: string;
  savedAt: Date;
  saving?: boolean;
  saved?: boolean;
  error?: boolean;
}

const ICONES_LUCIDE: Record<CategoriaItem, string> = {
  NOVIDADE: 'Star',
  MELHORIA: 'TrendingUp',
  CORRECAO: 'Wrench',
  SEGURANCA: 'Shield',
  PERFORMANCE: 'Zap',
  DOCUMENTACAO: 'FilePen',
  AJUSTE_TECNICO: 'Code',
  IMPACTO_OPERACIONAL: 'AlertTriangle',
  IMPORTANTE: 'Info',
};

@Component({
  selector: 'app-rf-builder-timeline',
  standalone: true,
  imports: [DatePipe, SlicePipe, LucideAngularModule, DragDropModule, ButtonComponent],
  templateUrl: './rf-builder-timeline.component.html',
  styleUrl: './rf-builder-timeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfBuilderTimelineComponent {
  readonly entradas = input.required<EntradaTimeline[]>();
  readonly encerrando = input<boolean>(false);

  readonly removerEntrada = output<EntradaTimeline>();
  readonly entradaDrop = output<CdkDragDrop<EntradaTimeline[]>>();
  readonly encerrar = output<void>();

  protected readonly categoriaCores = CATEGORIA_CORES;
  protected readonly categoriaLabels = CATEGORIA_LABELS;
  protected readonly categoriaIconesLucide = ICONES_LUCIDE;
}
