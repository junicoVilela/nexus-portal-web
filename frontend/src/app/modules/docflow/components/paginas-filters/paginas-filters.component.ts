import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent, StatusPillBarComponent, type StatusPillItem } from '@shared/ui';
import { Modulo } from '../../models/modulo.model';
import { Projeto } from '../../models/projeto.model';
import { StatusPagina } from '../../models/pagina.model';

@Component({
  selector: 'app-paginas-filters',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, StatusPillBarComponent],
  templateUrl: './paginas-filters.component.html',
  styleUrl: './paginas-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginasFiltersComponent {
  readonly form = input.required<FormGroup>();
  readonly projetos = input.required<Projeto[]>();
  readonly modulos = input.required<Modulo[]>();
  readonly ordemStatus = input.required<StatusPagina[]>();
  readonly totalSistema = input.required<number>();
  readonly contagemPorStatus = input.required<(s: StatusPagina) => number>();

  readonly aplicarFiltros = output<void>();
  readonly limparFiltros = output<void>();
  readonly projetoChange = output<void>();
  readonly statusEditorial = output<StatusPagina | ''>();

  protected readonly pillItems = computed<StatusPillItem<StatusPagina>[]>(() =>
    this.ordemStatus().map(st => ({ value: st, label: st, count: this.contagemPorStatus()(st) })),
  );
}
