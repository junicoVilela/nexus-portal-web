import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PaginaRevisao } from '@modules/docflow/models/pagina.model';
import { SortDirection } from '@shared/utils/query-state';
import { ButtonComponent } from '@shared/ui';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';

export type { DiffLinha, DiffToken } from '@modules/docflow/utils/diff.util';
import type { DiffLinha } from '@modules/docflow/utils/diff.util';

@Component({
  selector: 'app-pagina-revisoes',
  standalone: true,
  imports: [DatePipe, ButtonComponent, TablePaginationComponent],
  templateUrl: './pagina-revisoes.component.html',
  styleUrl: './pagina-revisoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaRevisoesComponent {
  private readonly tipos: Record<PaginaRevisao['tipo'], string> = {
    CRIACAO: 'Criação',
    SALVAMENTO_MANUAL: 'Salvamento manual',
    RETORNO_RASCUNHO: 'Retorno a rascunho',
    ENVIO_REVISAO: 'Envio para revisão',
    APROVACAO: 'Aprovação',
    PUBLICACAO: 'Publicação',
    ARQUIVAMENTO: 'Arquivamento',
    DUPLICACAO: 'Duplicação',
    COMENTARIO: 'Comentário editorial',
  };
  readonly revisoes = input.required<PaginaRevisao[]>();
  readonly totalRevisoes = input.required<number>();
  readonly revisoesPage = input.required<number>();
  readonly revisoesPageSize = input.required<number>();
  readonly revisoesSort = input.required<string>();
  readonly revisoesDir = input.required<SortDirection>();
  readonly showDiff = input.required<boolean>();
  readonly diffLinhas = input.required<DiffLinha[]>();
  readonly nomeUsuario = input.required<(username?: string) => string>();

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly sortChange = output<string>();
  readonly toggleDiff = output<void>();

  protected indicacao(campo: string): string {
    if (this.revisoesSort() !== campo) return '↕';
    return this.revisoesDir() === 'ASC' ? '↑' : '↓';
  }

  protected tipoLabel(tipo: PaginaRevisao['tipo']): string {
    return this.tipos[tipo];
  }
}
