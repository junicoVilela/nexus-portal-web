import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type PaginaCreationStepId = 'modelo' | 'contexto' | 'conteudo' | 'revisao';

export interface PaginaCreationStep {
  id: PaginaCreationStepId;
  label: string;
  description: string;
  complete: boolean;
}

@Component({
  selector: 'app-pagina-creation-progress',
  standalone: true,
  templateUrl: './pagina-creation-progress.component.html',
  styleUrl: './pagina-creation-progress.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaCreationProgressComponent {
  readonly steps = input.required<PaginaCreationStep[]>();
  readonly current = input.required<PaginaCreationStepId>();
  readonly selected = output<PaginaCreationStepId>();

  readonly completed = computed(() => this.steps().filter(step => step.complete).length);
  readonly progress = computed(() =>
    this.steps().length ? Math.round((this.completed() / this.steps().length) * 100) : 0,
  );
}
