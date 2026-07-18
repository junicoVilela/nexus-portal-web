import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Projeto } from '@modules/docflow/models/projeto.model';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { AuditStampComponent } from '@shared/components/audit-stamp/audit-stamp.component';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import {
  compactQueryParams,
  parsePositiveInt,
  parseSortDirection,
  SortDirection,
} from '@shared/utils/query-state';
import { carregarFiltros, salvarFiltros } from '@shared/utils/persisted-filters';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, ConfirmService, ToastService } from '@shared/ui';
import { PermissaoDirective } from '@modules/seguranca/directives';

@Component({
  selector: 'app-projetos',
  standalone: true,
  imports: [
    AuditStampComponent,
    TablePaginationComponent,
    ListPageComponent,
    ButtonComponent,
    BadgeComponent,
    PermissaoDirective,
  ],
  templateUrl: './projetos.component.html',
  styleUrl: './projetos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjetosComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly projetos = signal<Projeto[]>([]);
  protected readonly totalProjetos = signal(0);
  protected filtroNome = '';
  protected readonly projetosPage = signal(1);
  protected readonly projetosPageSize = signal(10);
  protected projetoSort = 'nome';
  protected projetoDir: SortDirection = 'ASC';
  protected readonly excluindoId = signal<string | null>(null);

  constructor(
    private readonly projetoService: ProjetoService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const temQueryParams = params.keys.length > 0;
      const persistidos = temQueryParams
        ? null
        : carregarFiltros<{
            nome: string;
            sort: string;
            dir: SortDirection;
            pageSize: number;
          }>('docflow:projetos');
      this.filtroNome = params.get('nome') ?? persistidos?.nome ?? '';
      this.projetoSort = params.get('sort') ?? persistidos?.sort ?? 'nome';
      this.projetoDir = parseSortDirection(params.get('dir') ?? persistidos?.dir ?? null);
      this.projetosPage.set(parsePositiveInt(params.get('page'), 1));
      this.projetosPageSize.set(parsePositiveInt(params.get('size'), persistidos?.pageSize ?? 10));
      this.carregar();
    });
  }

  carregar(): void {
    this.projetoService
      .listarProjetos({
        nome: this.filtroNome.trim() || undefined,
        sort: this.projetoSort,
        dir: this.projetoDir,
        page: this.projetosPage(),
        size: this.projetosPageSize(),
      })
      .subscribe({
        next: response => {
          this.projetos.set(response.items);
          this.totalProjetos.set(response.totalItems);
          this.projetosPage.set(response.page);
          this.projetosPageSize.set(response.size);
        },
        error: () => this.toast.error('Erro ao carregar projetos.'),
      });
  }

  editar(projeto: Projeto): void {
    this.router.navigate(docFlowRouterCommands(['projetos', projeto.id, 'editar']));
  }

  async excluir(projeto: Projeto): Promise<void> {
    if (this.excluindoId()) return;
    const confirmado = await this.confirm.confirm({
      title: 'Excluir projeto?',
      message: `O projeto "${projeto.nome}" será excluído. Remova antes todos os módulos vinculados a ele.`,
      acceptLabel: 'Excluir projeto',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;

    this.excluindoId.set(projeto.id);
    this.projetoService
      .excluirProjeto(projeto.id)
      .pipe(finalize(() => this.excluindoId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Projeto excluído.');
          if (this.projetos().length === 1 && this.projetosPage() > 1) {
            this.projetosPage.update(page => page - 1);
            this.atualizarUrl();
          } else {
            this.carregar();
          }
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao excluir projeto.')),
      });
  }

  novo(): void {
    this.router.navigate(docFlowRouterCommands(['projetos', 'novo']));
  }

  atualizarFiltro(event: Event): void {
    this.filtroNome = (event.target as HTMLInputElement).value;
    this.projetosPage.set(1);
    this.atualizarUrl();
  }

  ordenar(campo: string): void {
    if (this.projetoSort === campo) {
      this.projetoDir = this.projetoDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.projetoSort = campo;
      this.projetoDir = 'ASC';
    }
    this.projetosPage.set(1);
    this.atualizarUrl();
  }

  indicacaoOrdenacao(campo: string): string {
    if (this.projetoSort !== campo) return '↕';
    return this.projetoDir === 'ASC' ? '↑' : '↓';
  }

  alterarPagina(page: number): void {
    this.projetosPage.set(page);
    this.atualizarUrl();
  }

  alterarTamanhoPagina(size: number): void {
    this.projetosPageSize.set(size);
    this.projetosPage.set(1);
    this.atualizarUrl();
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (error.status === 403) return 'Seu usuário não tem permissão para executar esta ação.';
    if (typeof error.error?.message === 'string') return error.error.message;
    if (Array.isArray(error.error?.errors) && error.error.errors.length > 0) {
      return error.error.errors.join(' ');
    }
    return fallback;
  }

  private atualizarUrl(): void {
    salvarFiltros('docflow:projetos', {
      nome: this.filtroNome.trim(),
      sort: this.projetoSort,
      dir: this.projetoDir,
      pageSize: this.projetosPageSize(),
    });
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: compactQueryParams(
        {
          nome: this.filtroNome.trim() || null,
          sort: this.projetoSort === 'nome' && this.projetoDir === 'ASC' ? null : this.projetoSort,
          dir: this.projetoSort === 'nome' && this.projetoDir === 'ASC' ? null : this.projetoDir,
          page: this.projetosPage(),
          size: this.projetosPageSize(),
        },
        { page: 1, size: 10 },
      ),
    });
  }
}
