import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Modulo } from '@modules/docflow/models/modulo.model';
import { Projeto } from '@modules/docflow/models/projeto.model';
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
  selector: 'app-modulos',
  standalone: true,
  imports: [
    AuditStampComponent,
    TablePaginationComponent,
    ListPageComponent,
    ButtonComponent,
    BadgeComponent,
    PermissaoDirective,
  ],
  templateUrl: './modulos.component.html',
  styleUrl: './modulos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulosComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly projetos = signal<Projeto[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly totalModulos = signal(0);
  protected projetoId = '';
  protected filtroNome = '';
  protected moduloSort = 'projeto.nome';
  protected moduloDir: SortDirection = 'ASC';
  protected readonly modulosPage = signal(1);
  protected readonly modulosPageSize = signal(10);
  protected readonly excluindoId = signal<string | null>(null);

  constructor(
    private readonly moduloService: ModuloService,
    private readonly projetoService: ProjetoService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.carregarProjetos();
    this.route.queryParamMap.subscribe(params => {
      const temQueryParams = params.keys.length > 0;
      const persistidos = temQueryParams
        ? null
        : carregarFiltros<{
            projetoId: string;
            nome: string;
            sort: string;
            dir: SortDirection;
            pageSize: number;
          }>('docflow:modulos');
      this.projetoId = params.get('projetoId') ?? persistidos?.projetoId ?? '';
      this.filtroNome = params.get('nome') ?? persistidos?.nome ?? '';
      this.moduloSort = params.get('sort') ?? persistidos?.sort ?? 'projeto.nome';
      this.moduloDir = parseSortDirection(params.get('dir') ?? persistidos?.dir ?? null);
      this.modulosPage.set(parsePositiveInt(params.get('page'), 1));
      this.modulosPageSize.set(parsePositiveInt(params.get('size'), persistidos?.pageSize ?? 10));
      this.carregar();
    });
  }

  carregarProjetos(): void {
    this.projetoService.projetos().subscribe({
      next: v => this.projetos.set([...v].sort((a, b) => a.nome.localeCompare(b.nome))),
      error: () => this.toast.error('Erro ao carregar projetos.'),
    });
  }

  carregar(): void {
    if (!this.projetoId) {
      this.modulos.set([]);
      this.totalModulos.set(0);
      this.modulosPage.set(1);
      return;
    }
    this.moduloService
      .listarModulos({
        projetoId: this.projetoId,
        nome: this.filtroNome.trim() || undefined,
        sort: this.moduloSort,
        dir: this.moduloDir,
        page: this.modulosPage(),
        size: this.modulosPageSize(),
      })
      .subscribe({
        next: response => {
          this.modulos.set(response.items);
          this.totalModulos.set(response.totalItems);
          this.modulosPage.set(response.page);
          this.modulosPageSize.set(response.size);
        },
        error: () => this.toast.error('Erro ao carregar módulos.'),
      });
  }

  editar(modulo: Modulo): void {
    this.router.navigate(docFlowRouterCommands(['modulos', modulo.id, 'editar']));
  }

  async excluir(modulo: Modulo): Promise<void> {
    if (this.excluindoId()) return;
    const confirmado = await this.confirm.confirm({
      title: 'Excluir módulo?',
      message: `O módulo "${modulo.nome}" será excluído. Remova antes todas as páginas vinculadas a ele.`,
      acceptLabel: 'Excluir módulo',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;

    this.excluindoId.set(modulo.id);
    this.moduloService
      .excluirModulo(modulo.id)
      .pipe(finalize(() => this.excluindoId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Módulo excluído.');
          if (this.modulos().length === 1 && this.modulosPage() > 1) {
            this.modulosPage.update(page => page - 1);
            this.atualizarUrl();
          } else {
            this.carregar();
          }
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao excluir módulo.')),
      });
  }

  novo(): void {
    this.router.navigate(docFlowRouterCommands(['modulos', 'novo']));
  }

  selecionarProjeto(event: Event): void {
    this.projetoId = (event.target as HTMLInputElement).value;
    this.filtroNome = '';
    this.modulosPage.set(1);
    this.atualizarUrl();
  }

  atualizarFiltro(event: Event): void {
    this.filtroNome = (event.target as HTMLInputElement).value;
    this.modulosPage.set(1);
    this.atualizarUrl();
  }

  ordenar(campo: string): void {
    if (this.moduloSort === campo) {
      this.moduloDir = this.moduloDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.moduloSort = campo;
      this.moduloDir = 'ASC';
    }
    this.modulosPage.set(1);
    this.atualizarUrl();
  }

  indicacaoOrdenacao(campo: string): string {
    if (this.moduloSort !== campo) return '↕';
    return this.moduloDir === 'ASC' ? '↑' : '↓';
  }

  alterarPagina(page: number): void {
    this.modulosPage.set(page);
    this.atualizarUrl();
  }

  alterarTamanhoPagina(size: number): void {
    this.modulosPageSize.set(size);
    this.modulosPage.set(1);
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
    salvarFiltros('docflow:modulos', {
      projetoId: this.projetoId,
      nome: this.filtroNome.trim(),
      sort: this.moduloSort,
      dir: this.moduloDir,
      pageSize: this.modulosPageSize(),
    });
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: compactQueryParams(
        {
          projetoId: this.projetoId || null,
          nome: this.filtroNome.trim() || null,
          sort: this.moduloSort === 'projeto.nome' && this.moduloDir === 'ASC' ? null : this.moduloSort,
          dir: this.moduloSort === 'projeto.nome' && this.moduloDir === 'ASC' ? null : this.moduloDir,
          page: this.modulosPage(),
          size: this.modulosPageSize(),
        },
        { page: 1, size: 10 },
      ),
    });
  }
}
