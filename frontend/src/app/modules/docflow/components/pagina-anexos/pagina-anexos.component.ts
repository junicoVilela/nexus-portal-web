import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PaginaAnexo } from '@modules/docflow/models/pagina.model';
import { ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-pagina-anexos',
  standalone: true,
  imports: [DecimalPipe, ButtonComponent],
  templateUrl: './pagina-anexos.component.html',
  styleUrl: './pagina-anexos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaAnexosComponent {
  readonly anexos = input.required<PaginaAnexo[]>();
  readonly anexoUrl = input.required<(anexo: PaginaAnexo) => string>();

  readonly anexarSolicitado = output<void>();
  readonly excluirSolicitado = output<PaginaAnexo>();
}
