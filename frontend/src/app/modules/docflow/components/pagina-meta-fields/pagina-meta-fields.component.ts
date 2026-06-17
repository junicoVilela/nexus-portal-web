import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Modulo } from '../../models/modulo.model';
import { Pagina } from '../../models/pagina.model';
import { Projeto } from '../../models/projeto.model';

@Component({
  selector: 'app-pagina-meta-fields',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pagina-meta-fields.component.html',
  styleUrl: './pagina-meta-fields.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaMetaFieldsComponent {
  readonly form = input.required<FormGroup>();
  readonly projetos = input.required<Projeto[]>();
  readonly modulos = input.required<Modulo[]>();
  readonly parentOptions = input.required<Pagina[]>();
  readonly paginaLabel = input.required<(p: Pagina) => string>();

  readonly projetoChange = output<void>();
  readonly moduloChange = output<void>();
}
