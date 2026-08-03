import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { GrupoAcesso } from '@modules/identity-access/models/grupo-acesso.model';
import { GrupoService } from '@modules/identity-access/services/grupo.service';
import { PermissaoDirective } from '@modules/identity-access/directives/permissao.directive';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, ConfirmService, ToastService } from '@shared/ui';

@Component({
  selector: 'app-grupos-list',
  standalone: true,
  imports: [ListPageComponent, TablePaginationComponent, BadgeComponent, ButtonComponent, PermissaoDirective],
  templateUrl: './grupos-list.component.html',
  styleUrl: './grupos-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposListComponent implements OnInit {
  private readonly grupoService = inject(GrupoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly grupos = signal<GrupoAcesso[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected busca = '';
  protected filtroAtivo: '' | 'true' | 'false' = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.grupoService
      .listar({
        q: this.busca.trim() || undefined,
        ativo: this.filtroAtivo === '' ? undefined : this.filtroAtivo === 'true',
        page: this.page(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: r => {
          this.grupos.set(r.items);
          this.total.set(r.totalItems);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar grupos.'),
      });
  }

  novo(): void {
    this.router.navigate(['/seguranca/grupos/novo']);
  }

  editar(g: GrupoAcesso): void {
    this.router.navigate(['/seguranca/grupos', g.id, 'editar']);
  }

  vincularPermissoes(g: GrupoAcesso): void {
    this.router.navigate(['/seguranca/grupos', g.id, 'permissoes']);
  }

  aplicarBusca(event: Event): void {
    this.busca = (event.target as HTMLInputElement).value;
    this.page.set(1);
    this.carregar();
  }

  alterarAtivo(value: string): void {
    this.filtroAtivo = value as '' | 'true' | 'false';
    this.page.set(1);
    this.carregar();
  }

  alterarPagina(p: number): void {
    this.page.set(p);
    this.carregar();
  }

  alterarPageSize(s: number): void {
    this.pageSize.set(s);
    this.page.set(1);
    this.carregar();
  }

  async toggleAtivo(g: GrupoAcesso): Promise<void> {
    const ok = await this.confirm.confirm({
      title: g.ativo ? 'Inativar grupo?' : 'Ativar grupo?',
      message: `Deseja ${g.ativo ? 'inativar' : 'ativar'} o grupo ${g.nome}?`,
      acceptLabel: g.ativo ? 'Inativar' : 'Ativar',
      variant: g.ativo ? 'danger' : 'primary',
    });
    if (!ok) return;
    this.grupoService.alterarStatus(g.id, !g.ativo).subscribe({
      next: atu => {
        this.grupos.update(list => list.map(x => (x.id === atu.id ? { ...x, ...atu } : x)));
        this.toast.success(atu.ativo ? 'Grupo ativado.' : 'Grupo inativado.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao alterar status.'),
    });
  }
}
