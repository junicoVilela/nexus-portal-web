import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { PaginaAnexo } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { ButtonComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-midias',
  standalone: true,
  imports: [DecimalPipe, FormsModule, ListPageComponent, ButtonComponent, TablePaginationComponent],
  templateUrl: './midias.component.html',
  styleUrl: './midias.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MidiasComponent implements OnInit {
  private readonly paginaService = inject(PaginaService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly anexos = signal<PaginaAnexo[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(24);
  protected readonly loading = signal(false);
  protected busca = '';

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.paginaService
      .bibliotecaAnexos(this.busca, this.page(), this.pageSize())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          this.anexos.set(response.items);
          this.total.set(response.totalItems);
        },
        error: () => this.toast.error('Não foi possível carregar a biblioteca de mídia.'),
      });
  }

  protected pesquisar(): void {
    this.page.set(1);
    this.carregar();
  }

  protected copiar(anexo: PaginaAnexo): void {
    void navigator.clipboard
      .writeText(this.paginaService.downloadAnexoUrl(anexo))
      .then(() => this.toast.success('Endereço da imagem copiado.'))
      .catch(() => this.toast.error('Não foi possível copiar o endereço.'));
  }

  protected editarPagina(anexo: PaginaAnexo): void {
    void this.router.navigate(docFlowRouterCommands(['paginas', anexo.paginaId, 'editar']));
  }

  protected alterarPagina(page: number): void {
    this.page.set(page);
    this.carregar();
  }

  protected alterarTamanhoPagina(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.carregar();
  }

  protected url(anexo: PaginaAnexo): string {
    return this.paginaService.downloadAnexoUrl(anexo);
  }
}
