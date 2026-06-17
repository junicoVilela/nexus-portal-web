import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { ClienteService } from '@modules/docflow/services/cliente.service';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Cliente } from '@modules/docflow/models/cliente.model';
import { Modulo } from '@modules/docflow/models/modulo.model';
import { Pagina } from '@modules/docflow/models/pagina.model';
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
import { BadgeComponent, ButtonComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    AuditStampComponent,
    TablePaginationComponent,
    ListPageComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesComponent implements OnInit {
  private readonly toast = inject(ToastService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly totalClientes = signal(0);
  protected readonly projetos = signal<Projeto[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly paginas = signal<Pagina[]>([]);
  protected readonly clienteVinculos = signal<Cliente | undefined>(undefined);
  protected readonly projetoIds = signal<Set<string>>(new Set());
  protected readonly moduloIds = signal<Set<string>>(new Set());
  protected readonly paginaIds = signal<Set<string>>(new Set());
  protected clienteFiltro = '';
  protected paginaFiltro = '';
  protected copiarOrigemClienteId = '';
  protected clienteVinculosId = '';
  protected pendingClienteVinculosId = '';
  protected clienteSort = 'nome';
  protected clienteDir: SortDirection = 'ASC';
  protected readonly clientesPage = signal(1);
  protected readonly clientesPageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly loadingVinculos = signal(false);
  protected paginasLoaded = false;
  protected readonly savingVinculos = signal(false);

  protected readonly modulosDisponiveis = computed<Modulo[]>(() => {
    const ids = this.projetoIds();
    const lista = this.modulos();
    if (ids.size === 0) return lista;
    return lista.filter(modulo => ids.has(modulo.projetoId));
  });

  protected readonly paginasPorModulo = computed<
    { moduloId: string; moduloNome: string; paginas: Pagina[] }[]
  >(() => {
    const filtro = this.paginaFiltro.trim().toLowerCase();
    const paginasFiltradas = this.paginas().filter(pagina => {
      if (!filtro) return true;
      return (
        pagina.titulo.toLowerCase().includes(filtro) ||
        pagina.codigoTela.toLowerCase().includes(filtro) ||
        pagina.moduloNome.toLowerCase().includes(filtro)
      );
    });
    return this.modulosDisponiveis()
      .map(modulo => ({
        moduloId: modulo.id,
        moduloNome: modulo.nome,
        paginas: paginasFiltradas.filter(pagina => pagina.moduloId === modulo.id),
      }))
      .filter(grupo => grupo.paginas.length > 0);
  });

  constructor(
    private readonly clienteService: ClienteService,
    private readonly projetoService: ProjetoService,
    private readonly moduloService: ModuloService,
    private readonly paginaService: PaginaService,
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
          }>('docflow:clientes');
      this.clienteFiltro = params.get('nome') ?? persistidos?.nome ?? '';
      this.pendingClienteVinculosId = params.get('clienteId') ?? '';
      this.clienteSort = params.get('sort') ?? persistidos?.sort ?? 'nome';
      this.clienteDir = parseSortDirection(params.get('dir') ?? persistidos?.dir ?? null);
      this.clientesPage.set(parsePositiveInt(params.get('page'), 1));
      this.clientesPageSize.set(parsePositiveInt(params.get('size'), persistidos?.pageSize ?? 10));
      this.carregar();
    });
  }

  carregar(): void {
    this.carregarClientes();
    this.carregarProjetos();
    this.carregarModulos();
  }

  carregarClientes(): void {
    this.loading.set(true);
    this.clienteService
      .listarClientes({
        nome: this.clienteFiltro.trim() || undefined,
        sort: this.clienteSort,
        dir: this.clienteDir,
        page: this.clientesPage(),
        size: this.clientesPageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          this.clientes.set(response.items);
          this.totalClientes.set(response.totalItems);
          this.clientesPage.set(response.page);
          this.clientesPageSize.set(response.size);
          const vinculadoAtual = this.clienteVinculos();
          if (vinculadoAtual) {
            this.clienteVinculos.set(this.clientes().find(cliente => cliente.id === vinculadoAtual.id));
          } else if (this.pendingClienteVinculosId) {
            const cliente = this.clientes().find(item => item.id === this.pendingClienteVinculosId);
            if (cliente) {
              this.pendingClienteVinculosId = '';
              this.abrirVinculos(cliente);
            }
          }
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao carregar clientes.')),
      });
  }

  carregarModulos(): void {
    this.moduloService.modulos().subscribe({
      next: modulos => this.modulos.set(this.sortModulos(modulos)),
      error: error => this.toast.error(this.errorMessage(error, 'Erro ao carregar módulos.')),
    });
  }

  carregarProjetos(): void {
    this.projetoService.projetos().subscribe({
      next: projetos => this.projetos.set([...projetos].sort((a, b) => a.nome.localeCompare(b.nome))),
      error: error => this.toast.error(this.errorMessage(error, 'Erro ao carregar projetos.')),
    });
  }

  carregarPaginas(): void {
    this.paginaService.paginas().subscribe({
      next: paginas => {
        this.paginas.set(this.sortPaginas(paginas));
        this.paginasLoaded = true;
      },
      error: error => this.toast.error(this.errorMessage(error, 'Erro ao carregar páginas.')),
    });
  }

  carregarDadosVinculos(cliente: Cliente): void {
    this.loadingVinculos.set(true);
    forkJoin({
      vinculos: this.clienteService.vinculosCliente(cliente.id),
      projetos: this.projetos().length > 0 ? of(this.projetos()) : this.projetoService.projetos(),
      modulos: this.modulos().length > 0 ? of(this.modulos()) : this.moduloService.modulos(),
      paginas: this.paginasLoaded ? of(this.paginas()) : this.paginaService.paginas(),
    })
      .pipe(
        finalize(() => {
          if (this.clienteVinculos()?.id === cliente.id) {
            this.loadingVinculos.set(false);
          }
        }),
      )
      .subscribe({
        next: ({ vinculos, projetos, modulos, paginas }) => {
          if (this.clienteVinculos()?.id !== cliente.id) return;
          this.projetos.set([...projetos].sort((a, b) => a.nome.localeCompare(b.nome)));
          this.modulos.set(this.sortModulos(modulos));
          this.paginas.set(this.sortPaginas(paginas));
          this.paginasLoaded = true;
          this.projetoIds.set(new Set(vinculos.projetoIds));
          this.moduloIds.set(new Set(vinculos.moduloIds));
          this.paginaIds.set(new Set(vinculos.paginaIds));
        },
        error: error => {
          if (this.clienteVinculos()?.id === cliente.id) {
            this.toast.error(this.errorMessage(error, 'Erro ao carregar vínculos.'));
          }
        },
      });
  }

  editar(cliente: Cliente): void {
    this.router.navigate(docFlowRouterCommands(['clientes', cliente.id, 'editar']));
  }

  abrirVinculos(cliente: Cliente): void {
    this.clienteVinculosId = cliente.id;
    this.clienteVinculos.set(cliente);
    this.loadingVinculos.set(true);
    this.projetoIds.set(new Set());
    this.moduloIds.set(new Set());
    this.paginaIds.set(new Set());
    this.carregarDadosVinculos(cliente);
    this.atualizarUrlClientes();
  }

  salvarVinculos(): void {
    const vinculado = this.clienteVinculos();
    if (!vinculado || this.loadingVinculos()) return;
    this.savingVinculos.set(true);
    forkJoin([
      this.clienteService.salvarProjetosCliente(vinculado.id, [...this.projetoIds()]),
      this.clienteService.salvarModulosCliente(vinculado.id, [...this.moduloIds()]),
      this.clienteService.salvarPaginasCliente(vinculado.id, [...this.paginaIds()]),
    ])
      .pipe(finalize(() => this.savingVinculos.set(false)))
      .subscribe({
        next: () => this.toast.success('Vínculos salvos.'),
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao salvar vínculos.')),
      });
  }

  toggleProjeto(id: string): void {
    this.projetoIds.update(set => this.toggled(set, id));
    this.normalizarSelecoesDependentes();
  }

  copiarVinculos(): void {
    const vinculado = this.clienteVinculos();
    if (!vinculado || !this.copiarOrigemClienteId || this.loadingVinculos()) return;
    this.savingVinculos.set(true);
    this.clienteService
      .copiarVinculosCliente(vinculado.id, this.copiarOrigemClienteId)
      .pipe(finalize(() => this.savingVinculos.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Configuração copiada.');
          this.carregarDadosVinculos(vinculado);
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao copiar configuração.')),
      });
  }

  toggleModulo(id: string): void {
    this.moduloIds.update(set => this.toggled(set, id));
  }

  togglePagina(id: string): void {
    this.paginaIds.update(set => this.toggled(set, id));
  }

  novo(): void {
    this.router.navigate(docFlowRouterCommands(['clientes', 'novo']));
  }

  fecharVinculos(): void {
    this.clienteVinculos.set(undefined);
    this.clienteVinculosId = '';
    this.projetoIds.set(new Set());
    this.moduloIds.set(new Set());
    this.paginaIds.set(new Set());
    this.paginaFiltro = '';
    this.copiarOrigemClienteId = '';
    this.loadingVinculos.set(false);
    this.atualizarUrlClientes();
  }

  selecionarTodosModulos(): void {
    this.moduloIds.set(new Set(this.modulosDisponiveis().map(modulo => modulo.id)));
  }

  selecionarTodosProjetos(): void {
    this.projetoIds.set(new Set(this.projetos().map(projeto => projeto.id)));
  }

  limparProjetos(): void {
    this.projetoIds.set(new Set());
  }
  limparModulos(): void {
    this.moduloIds.set(new Set());
  }
  limparPaginas(): void {
    this.paginaIds.set(new Set());
  }

  alternarPaginasDoModulo(paginas: Pagina[]): void {
    this.paginaIds.update(prev => {
      const next = new Set(prev);
      const allSelected = paginas.every(pagina => next.has(pagina.id));
      paginas.forEach(pagina => (allSelected ? next.delete(pagina.id) : next.add(pagina.id)));
      return next;
    });
  }

  todasPaginasSelecionadas(paginas: Pagina[]): boolean {
    const ids = this.paginaIds();
    return paginas.length > 0 && paginas.every(pagina => ids.has(pagina.id));
  }

  atualizarFiltroClientes(event: Event): void {
    this.clienteFiltro = (event.target as HTMLInputElement).value;
    this.clientesPage.set(1);
    this.atualizarUrlClientes();
  }

  ordenarClientes(campo: string): void {
    if (this.clienteSort === campo) {
      this.clienteDir = this.clienteDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.clienteSort = campo;
      this.clienteDir = 'ASC';
    }
    this.clientesPage.set(1);
    this.atualizarUrlClientes();
  }

  indicacaoOrdenacao(campo: string): string {
    if (this.clienteSort !== campo) return '↕';
    return this.clienteDir === 'ASC' ? '↑' : '↓';
  }

  alterarPaginaClientes(page: number): void {
    this.clientesPage.set(page);
    this.atualizarUrlClientes();
  }

  alterarTamanhoPaginaClientes(size: number): void {
    this.clientesPageSize.set(size);
    this.clientesPage.set(1);
    this.atualizarUrlClientes();
  }

  eventValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (typeof error.error?.message === 'string') return error.error.message;
    if (Array.isArray(error.error?.errors) && error.error.errors.length > 0) {
      return error.error.errors.join(' ');
    }
    return fallback;
  }

  private sortModulos(modulos: Modulo[]): Modulo[] {
    return [...modulos].sort(
      (a, b) =>
        a.projetoNome.localeCompare(b.projetoNome) || a.ordem - b.ordem || a.nome.localeCompare(b.nome),
    );
  }

  private sortPaginas(paginas: Pagina[]): Pagina[] {
    return [...paginas].sort(
      (a, b) =>
        a.moduloNome.localeCompare(b.moduloNome) || a.ordem - b.ordem || a.titulo.localeCompare(b.titulo),
    );
  }

  private normalizarSelecoesDependentes(): void {
    if (this.projetoIds().size === 0) return;

    const moduloIdsVisiveis = new Set(this.modulosDisponiveis().map(modulo => modulo.id));
    this.moduloIds.update(prev => new Set([...prev].filter(id => moduloIdsVisiveis.has(id))));
    this.paginaIds.update(
      prev =>
        new Set(
          this.paginas()
            .filter(pagina => this.projetoIds().has(pagina.projetoId) && prev.has(pagina.id))
            .map(pagina => pagina.id),
        ),
    );
  }

  private toggled(values: Set<string>, id: string): Set<string> {
    const next = new Set(values);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }

  private atualizarUrlClientes(): void {
    salvarFiltros('docflow:clientes', {
      nome: this.clienteFiltro.trim(),
      sort: this.clienteSort,
      dir: this.clienteDir,
      pageSize: this.clientesPageSize(),
    });
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: compactQueryParams(
        {
          nome: this.clienteFiltro.trim() || null,
          clienteId: this.clienteVinculosId || null,
          sort: this.clienteSort === 'nome' && this.clienteDir === 'ASC' ? null : this.clienteSort,
          dir: this.clienteSort === 'nome' && this.clienteDir === 'ASC' ? null : this.clienteDir,
          page: this.clientesPage(),
          size: this.clientesPageSize(),
        },
        { page: 1, size: 10 },
      ),
    });
  }
}
