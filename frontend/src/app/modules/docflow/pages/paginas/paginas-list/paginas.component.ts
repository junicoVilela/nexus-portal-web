import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Modulo } from '@modules/docflow/models/modulo.model';
import { Pagina, StatusPagina } from '@modules/docflow/models/pagina.model';
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
import {
  BulkActionBarComponent,
  ButtonComponent,
  ConfirmService,
  MoreActionsComponent,
  NotificationService,
  ToastService,
} from '@shared/ui';
import { PaginaStatusBadgeComponent } from '@modules/docflow/components/pagina-status-badge';
import { PaginasFiltersComponent } from '@modules/docflow/components/paginas-filters';
import { PermissaoDirective } from '@modules/identity-access/directives';
import { AuthService } from '@core/auth/services/auth.service';

@Component({
  selector: 'app-paginas',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AuditStampComponent,
    TablePaginationComponent,
    ListPageComponent,
    ButtonComponent,
    BulkActionBarComponent,
    PaginaStatusBadgeComponent,
    PaginasFiltersComponent,
    MoreActionsComponent,
    PermissaoDirective,
  ],
  templateUrl: './paginas.component.html',
  styleUrl: './paginas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginasComponent implements OnInit, OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private eventosSubscription?: Subscription;
  readonly podeEditarPagina = computed(() => this.auth.tem()('PAGINA:EDITAR'));
  readonly projetos = signal<Projeto[]>([]);
  readonly todosModulos = signal<Modulo[]>([]);
  readonly modulos = signal<Modulo[]>([]);
  readonly paginas = signal<Pagina[]>([]);
  readonly totalPaginas = signal(0);
  readonly draggingPaginaId = signal('');
  readonly paginasPage = signal(1);
  readonly paginasPageSize = signal(10);
  readonly selecionados = signal<Set<string>>(new Set());
  readonly totalSelecionados = computed(() => this.selecionados().size);
  readonly filtrosAtivos = computed(() => {
    const raw = this.filtros.getRawValue();
    return !!(
      raw.busca.trim() ||
      raw.titulo.trim() ||
      raw.codigoTela.trim() ||
      raw.projetoId ||
      raw.moduloId ||
      raw.status
    );
  });
  /** Com módulo filtrado, a lista carrega a árvore completa (até 1000) e a paginação some. */
  readonly ocultarPaginacao = computed(() => !!this.filtros.controls.moduloId.value);
  readonly listaVaziaPorFiltro = computed(() => this.totalPaginas() === 0 && this.filtrosAtivos());
  readonly sistemaSemPaginas = computed(() => this.totalPaginasSistema() === 0);
  readonly emptyTitleAtual = computed(() =>
    this.listaVaziaPorFiltro() && !this.sistemaSemPaginas()
      ? 'Nenhuma página corresponde aos filtros'
      : 'Nenhuma página encontrada',
  );
  readonly emptyDescriptionAtual = computed(() =>
    this.listaVaziaPorFiltro() && !this.sistemaSemPaginas()
      ? 'Tente outros termos de busca ou limpe os filtros para ver mais resultados.'
      : 'Ajuste os filtros ou crie a primeira página para este módulo.',
  );
  readonly selecionadosParaRevisao = computed(() =>
    this.paginas().filter(p => this.selecionados().has(p.id) && p.status === 'RASCUNHO'),
  );
  readonly selecionadosParaAprovar = computed(() =>
    this.paginas().filter(p => this.selecionados().has(p.id) && p.status === 'EM_REVISAO'),
  );
  readonly selecionadosParaPublicar = computed(() =>
    this.paginas().filter(p => this.selecionados().has(p.id) && p.status === 'APROVADO'),
  );
  readonly todosVisiveisSelecionados = computed(() => {
    const lista = this.paginas();
    const sel = this.selecionados();
    return lista.length > 0 && lista.every(p => sel.has(p.id));
  });
  paginaSort = 'modulo.projeto.nome';
  paginaDir: SortDirection = 'ASC';
  readonly ordemStatusEditorial: StatusPagina[] = [
    'RASCUNHO',
    'EM_REVISAO',
    'APROVADO',
    'PUBLICADO',
    'ARQUIVADO',
  ];
  readonly filtros = this.fb.nonNullable.group({
    busca: [''],
    titulo: [''],
    codigoTela: [''],
    projetoId: [''],
    moduloId: [''],
    status: [''],
  });
  readonly resumoStatusGlobal = signal<Record<string, number>>({});
  readonly excluindoId = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly projetoService: ProjetoService,
    private readonly moduloService: ModuloService,
    private readonly paginaService: PaginaService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      projetos: this.projetoService.projetos(),
      modulos: this.moduloService.modulos(),
      resumo: this.paginaService.resumoPaginasPorStatusGlobal(),
    }).subscribe({
      next: ({ projetos, modulos, resumo }) => {
        this.projetos.set(projetos);
        this.todosModulos.set(modulos);
        this.resumoStatusGlobal.set(resumo);
        this.route.queryParamMap.subscribe(params => {
          const temQueryParams = params.keys.length > 0;
          const persistidos = temQueryParams
            ? null
            : carregarFiltros<{
                busca: string;
                titulo: string;
                codigoTela: string;
                projetoId: string;
                moduloId: string;
                status: string;
                sort: string;
                dir: SortDirection;
                pageSize: number;
              }>('docflow:paginas');
          this.filtros.patchValue(
            {
              busca: params.get('busca') ?? persistidos?.busca ?? '',
              titulo: params.get('titulo') ?? persistidos?.titulo ?? '',
              codigoTela: params.get('codigoTela') ?? persistidos?.codigoTela ?? '',
              projetoId: params.get('projetoId') ?? persistidos?.projetoId ?? '',
              moduloId: params.get('moduloId') ?? persistidos?.moduloId ?? '',
              status: params.get('status') ?? persistidos?.status ?? '',
            },
            { emitEvent: false },
          );
          this.paginaSort = params.get('sort') ?? persistidos?.sort ?? 'modulo.projeto.nome';
          this.paginaDir = parseSortDirection(params.get('dir') ?? persistidos?.dir ?? null);
          this.paginasPage.set(parsePositiveInt(params.get('page'), 1));
          this.paginasPageSize.set(parsePositiveInt(params.get('size'), persistidos?.pageSize ?? 10));
          this.atualizarModulosPorProjeto();
          this.carregar();
        });
      },
      error: () => this.toast.error('Erro ao carregar páginas.'),
    });
    this.eventosSubscription = this.paginaService.eventosPagina().subscribe({
      next: evento => {
        if (!evento.id || !evento.titulo || !evento.status || !evento.acao) {
          this.carregar();
          return;
        }
        this.tratarEventoPagina({
          id: evento.id,
          titulo: evento.titulo,
          status: evento.status,
          acao: evento.acao,
          usuario: evento.usuario,
        });
      },
      error: () => undefined,
    });
  }

  ngOnDestroy(): void {
    this.eventosSubscription?.unsubscribe();
  }

  private tratarEventoPagina(evento: {
    id: string;
    titulo: string;
    status: StatusPagina;
    acao: 'ENVIAR_REVISAO' | 'APROVAR' | 'PUBLICAR' | 'ARQUIVAR' | 'DEVOLVER';
    usuario?: string;
  }): void {
    this.carregar();
    const usuarioAtual = this.auth.currentUser();
    if (evento.usuario && usuarioAtual && evento.usuario === usuarioAtual) return;
    const mensagens: Record<typeof evento.acao, string> = {
      ENVIAR_REVISAO: `Página "${evento.titulo}" enviada para revisão`,
      APROVAR: `Página "${evento.titulo}" aprovada`,
      PUBLICAR: `Página "${evento.titulo}" publicada`,
      ARQUIVAR: `Página "${evento.titulo}" arquivada`,
      DEVOLVER: `Página "${evento.titulo}" devolvida para rascunho`,
    };
    this.notifications.add('info', mensagens[evento.acao], {
      href: docFlowRouterCommands(['paginas', evento.id, 'editar']).join('/'),
    });
  }

  carregar(): void {
    const raw = this.filtros.getRawValue();
    const moduloFiltrado = !!raw.moduloId;
    const page = moduloFiltrado ? 1 : this.paginasPage();
    const size = moduloFiltrado ? 1000 : this.paginasPageSize();
    this.paginaService
      .listarPaginas({
        busca: raw.busca?.trim() || undefined,
        titulo: raw.titulo || undefined,
        codigoTela: raw.codigoTela || undefined,
        projetoId: raw.projetoId || undefined,
        moduloId: raw.moduloId || undefined,
        status: raw.status as StatusPagina | undefined,
        sort: this.paginaSort,
        dir: this.paginaDir,
        page,
        size,
      })
      .subscribe({
        next: response => {
          this.paginas.set(response.items);
          this.totalPaginas.set(response.totalItems);
          if (moduloFiltrado) {
            this.paginasPage.set(1);
          } else {
            this.paginasPage.set(response.page);
            this.paginasPageSize.set(response.size);
            this.complementarAncestros(response.items);
          }
        },
        error: () => this.toast.error('Erro ao filtrar páginas.'),
      });
  }

  aplicarFiltros(): void {
    this.paginasPage.set(1);
    this.atualizarUrl();
  }

  filtroStatusEditorial(status: StatusPagina | ''): void {
    this.filtros.controls.status.setValue(status);
    this.paginasPage.set(1);
    this.atualizarUrl();
  }

  contagemGlobalStatus(status: StatusPagina): number {
    return this.resumoStatusGlobal()[status] ?? 0;
  }

  /** Arrow function estável para passar como `input()` ao filtro. */
  readonly contagemGlobalStatusFn = (status: StatusPagina): number => this.contagemGlobalStatus(status);

  totalPaginasSistema(): number {
    return Object.values(this.resumoStatusGlobal()).reduce((acc, v) => acc + v, 0);
  }

  editar(pagina: Pagina): void {
    this.router.navigate(docFlowRouterCommands(['paginas', pagina.id, 'editar']));
  }

  enviarRevisao(pagina: Pagina): void {
    this.paginaService.enviarRevisaoPagina(pagina.id).subscribe({
      next: () => {
        this.toast.success('Página enviada para revisão.');
        this.carregar();
      },
      error: () => this.toast.error('Erro ao enviar página para revisão.'),
    });
  }

  aprovar(pagina: Pagina): void {
    this.paginaService.aprovarPagina(pagina.id).subscribe({
      next: () => {
        this.toast.success('Página aprovada.');
        this.notifications.add('success', `Página "${pagina.titulo}" aprovada`, {
          href: docFlowRouterCommands(['paginas', pagina.id, 'editar']).join('/'),
        });
        this.carregar();
      },
      error: () => this.toast.error('Erro ao aprovar página.'),
    });
  }

  publicar(pagina: Pagina): void {
    this.paginaService.publicarPagina(pagina.id).subscribe({
      next: () => {
        this.toast.success('Página publicada.');
        this.notifications.add('success', `Página "${pagina.titulo}" publicada`, {
          description: pagina.moduloNome ? `Módulo: ${pagina.moduloNome}` : undefined,
          href: docFlowRouterCommands(['paginas', pagina.id, 'editar']).join('/'),
        });
        this.carregar();
      },
      error: () => this.toast.error('Erro ao publicar página.'),
    });
  }

  duplicar(pagina: Pagina): void {
    this.paginaService.duplicarPagina(pagina.id).subscribe({
      next: copia => {
        this.toast.success('Página duplicada.');
        this.router.navigate(docFlowRouterCommands(['paginas', copia.id, 'editar']));
      },
      error: () => this.toast.error('Erro ao duplicar página.'),
    });
  }

  async arquivar(pagina: Pagina): Promise<void> {
    const comFilhos = this.temFilhosNaLista(pagina.id);
    const ok = await this.confirmService.confirm({
      title: 'Arquivar página?',
      message: this.mensagemArquivar([pagina.titulo], comFilhos),
      acceptLabel: 'Arquivar',
      variant: 'danger',
      icon: 'AlertTriangle',
    });
    if (!ok) return;
    this.paginaService.arquivarPagina(pagina.id).subscribe({
      next: () => {
        this.toast.success('Página arquivada.');
        this.carregar();
      },
      error: () => this.toast.error('Erro ao arquivar página.'),
    });
  }

  async excluir(pagina: Pagina): Promise<void> {
    if (this.excluindoId()) return;
    const comFilhos = this.temFilhosNaLista(pagina.id);
    const message = comFilhos
      ? `A página "${pagina.titulo}", suas revisões, anexos e subpáginas vinculadas nesta lista serão excluídos permanentemente.`
      : `A página "${pagina.titulo}", suas revisões e anexos serão excluídos permanentemente. Se houver subpáginas fora desta lista, elas também serão excluídas.`;
    const ok = await this.confirmService.confirm({
      title: 'Excluir página?',
      message,
      acceptLabel: 'Excluir página',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!ok) return;

    this.excluindoId.set(pagina.id);
    this.paginaService
      .excluirPagina(pagina.id)
      .pipe(finalize(() => this.excluindoId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Página excluída.');
          this.selecionados.update(ids => {
            const atualizados = new Set(ids);
            atualizados.delete(pagina.id);
            return atualizados;
          });
          this.resumoStatusGlobal.update(resumo => ({
            ...resumo,
            [pagina.status]: Math.max(0, (resumo[pagina.status] ?? 1) - 1),
          }));
          if (this.paginas().length === 1 && this.paginasPage() > 1) {
            this.paginasPage.update(page => page - 1);
            this.atualizarUrl();
          } else {
            this.carregar();
          }
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao excluir página.')),
      });
  }

  nova(): void {
    const { projetoId, moduloId } = this.filtros.getRawValue();
    this.router.navigate(docFlowRouterCommands(['paginas', 'novo']), {
      queryParams: compactQueryParams({
        projetoId: projetoId || null,
        moduloId: moduloId || null,
      }),
    });
  }

  novaPorTipo(tipo: 'lista' | 'incluir' | 'editar' | 'indice' | 'menu'): void {
    const { projetoId, moduloId } = this.filtros.getRawValue();
    const parentId =
      moduloId && (tipo === 'lista' || tipo === 'incluir' || tipo === 'editar')
        ? this.encontrarPaginaIndice(moduloId)
        : undefined;
    this.router.navigate(docFlowRouterCommands(['paginas', 'novo']), {
      queryParams: compactQueryParams({
        projetoId: projetoId || null,
        moduloId: moduloId || null,
        parentId: parentId || null,
        tipoPagina: tipo,
      }),
    });
  }

  criarSubpagina(pagina: Pagina): void {
    this.router.navigate(docFlowRouterCommands(['paginas', 'novo']), {
      queryParams: compactQueryParams({
        projetoId: pagina.projetoId || null,
        moduloId: pagina.moduloId || null,
        parentId: pagina.id,
      }),
    });
  }

  toggleSelecionado(id: string): void {
    this.selecionados.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelecionarTodos(): void {
    const todos = this.todosVisiveisSelecionados();
    this.selecionados.update(set => {
      const next = new Set(set);
      for (const p of this.paginas()) {
        if (todos) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  async arquivarSelecionadas(): Promise<void> {
    const ids = [...this.selecionados()];
    const lista = this.paginas().filter(p => ids.includes(p.id) && p.status !== 'ARQUIVADO');
    if (lista.length === 0) return;
    const comFilhos = lista.some(p => this.temFilhosNaLista(p.id));
    const ok = await this.confirmService.confirm({
      title: 'Arquivar páginas?',
      message: this.mensagemArquivar(
        lista.map(p => p.titulo),
        comFilhos,
      ),
      acceptLabel: 'Arquivar',
      variant: 'danger',
      icon: 'AlertTriangle',
    });
    if (!ok) return;
    let restantes = lista.length;
    for (const p of lista) {
      this.paginaService.arquivarPagina(p.id).subscribe({
        next: () => {
          restantes--;
          if (restantes === 0) {
            this.toast.success(`${lista.length} página(s) arquivada(s).`);
            this.carregar();
          }
        },
        error: () => undefined /* feedback via errorInterceptor */,
      });
    }
    this.limparSelecao();
  }

  async enviarRevisaoSelecionadas(): Promise<void> {
    const lista = this.selecionadosParaRevisao();
    if (!lista.length) return;
    const ok = await this.confirmService.confirm({
      title: 'Enviar para revisão?',
      message: `Enviar ${lista.length} página(s) para revisão?`,
      acceptLabel: 'Enviar revisão',
      icon: 'Send',
    });
    if (!ok) return;
    let restantes = lista.length;
    for (const pagina of lista) {
      this.paginaService.enviarRevisaoPagina(pagina.id).subscribe({
        next: () => {
          restantes--;
          if (restantes === 0) {
            this.toast.success(`${lista.length} página(s) enviada(s) para revisão.`);
            this.carregar();
          }
        },
        error: () => undefined,
      });
    }
    this.limparSelecao();
  }

  async aprovarSelecionadas(): Promise<void> {
    const lista = this.selecionadosParaAprovar();
    if (!lista.length) return;
    const ok = await this.confirmService.confirm({
      title: 'Aprovar páginas?',
      message: `Aprovar ${lista.length} página(s) selecionada(s)?`,
      acceptLabel: 'Aprovar',
      icon: 'CheckCircle',
    });
    if (!ok) return;
    let restantes = lista.length;
    for (const pagina of lista) {
      this.paginaService.aprovarPagina(pagina.id).subscribe({
        next: () => {
          restantes--;
          if (restantes === 0) {
            this.toast.success(`${lista.length} página(s) aprovada(s).`);
            this.carregar();
          }
        },
        error: () => undefined,
      });
    }
    this.limparSelecao();
  }

  async publicarSelecionadas(): Promise<void> {
    const lista = this.selecionadosParaPublicar();
    if (!lista.length) return;
    const ok = await this.confirmService.confirm({
      title: 'Publicar páginas?',
      message: `Publicar ${lista.length} página(s) selecionada(s)?`,
      acceptLabel: 'Publicar',
      icon: 'Upload',
    });
    if (!ok) return;
    let restantes = lista.length;
    for (const pagina of lista) {
      this.paginaService.publicarPagina(pagina.id).subscribe({
        next: () => {
          restantes--;
          if (restantes === 0) {
            this.toast.success(`${lista.length} página(s) publicada(s).`);
            this.carregar();
          }
        },
        error: () => undefined,
      });
    }
    this.limparSelecao();
  }

  limparFiltros(): void {
    this.filtros.reset({
      busca: '',
      titulo: '',
      codigoTela: '',
      projetoId: '',
      moduloId: '',
      status: '',
    });
    this.atualizarModulosPorProjeto();
    this.paginasPage.set(1);
    this.atualizarUrl();
  }

  onProjetoChange(): void {
    this.atualizarModulosPorProjeto();
    this.paginasPage.set(1);
    this.atualizarUrl();
  }

  iniciarArraste(pagina: Pagina): void {
    this.draggingPaginaId.set(pagina.id);
  }

  moverParaCima(pagina: Pagina): void {
    this.deslocar(pagina, -1);
  }
  moverParaBaixo(pagina: Pagina): void {
    this.deslocar(pagina, +1);
  }

  private deslocar(pagina: Pagina, delta: -1 | 1): void {
    const irmaos = this.paginas()
      .filter(p => p.moduloId === pagina.moduloId && (p.parentId ?? null) === (pagina.parentId ?? null))
      .sort((a, b) => a.ordem - b.ordem);
    const idx = irmaos.findIndex(p => p.id === pagina.id);
    const novoIdx = idx + delta;
    if (idx < 0 || novoIdx < 0 || novoIdx >= irmaos.length) return;
    const reordenado = [...irmaos];
    [reordenado[idx], reordenado[novoIdx]] = [reordenado[novoIdx], reordenado[idx]];
    this.paginaService.reordenarPaginas(reordenado.map(p => p.id)).subscribe({
      next: () => {
        this.toast.success('Ordem atualizada.');
        this.carregar();
      },
      error: () => this.toast.error('Erro ao reordenar páginas.'),
    });
  }

  finalizarArraste(): void {
    this.draggingPaginaId.set('');
  }

  moverComoFilha(event: DragEvent, alvo: Pagina): void {
    event.preventDefault();
    event.stopPropagation();
    const pagina = this.paginas().find(item => item.id === this.draggingPaginaId());
    this.finalizarArraste();
    if (!pagina || pagina.id === alvo.id) return;
    if (pagina.moduloId !== alvo.moduloId) {
      this.toast.error('Arraste apenas entre páginas do mesmo módulo.');
      return;
    }
    this.moverPagina(pagina, alvo.id);
  }

  moverParaRaiz(event: DragEvent): void {
    event.preventDefault();
    const pagina = this.paginas().find(item => item.id === this.draggingPaginaId());
    this.finalizarArraste();
    if (!pagina || !pagina.parentId) return;
    this.moverPagina(pagina, undefined);
  }

  readonly paginasHierarquia = computed<Pagina[]>(() => {
    const lista = this.paginas();
    const filhos = new Map<string, Pagina[]>();
    const ids = new Set(lista.map(pagina => pagina.id));
    lista.forEach(pagina => {
      if (pagina.parentId) {
        filhos.set(pagina.parentId, [...(filhos.get(pagina.parentId) ?? []), pagina]);
      }
    });
    filhos.forEach(items => items.sort(this.compararPaginas));
    const roots = lista
      .filter(pagina => !pagina.parentId || !ids.has(pagina.parentId))
      .sort(this.compararPaginas);
    const ordenadas: Pagina[] = [];
    const append = (pagina: Pagina) => {
      ordenadas.push(pagina);
      (filhos.get(pagina.id) ?? []).forEach(append);
    };
    roots.forEach(append);
    return ordenadas;
  });

  alterarPagina(page: number): void {
    this.paginasPage.set(page);
    this.atualizarUrl();
  }

  alterarTamanhoPagina(size: number): void {
    this.paginasPageSize.set(size);
    this.paginasPage.set(1);
    this.atualizarUrl();
  }

  ordenar(campo: string): void {
    if (this.paginaSort === campo) {
      this.paginaDir = this.paginaDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.paginaSort = campo;
      this.paginaDir = 'ASC';
    }
    this.paginasPage.set(1);
    this.atualizarUrl();
  }

  indicacaoOrdenacao(campo: string): string {
    if (this.paginaSort !== campo) return '↕';
    return this.paginaDir === 'ASC' ? '↑' : '↓';
  }

  ariaOrdenacao(campo: string): 'ascending' | 'descending' | 'none' {
    if (this.paginaSort !== campo) return 'none';
    return this.paginaDir === 'ASC' ? 'ascending' : 'descending';
  }

  paginaLabel(pagina: Pagina): string {
    return `${'-- '.repeat(this.nivel(pagina))}${pagina.titulo}`;
  }

  nivel(pagina: Pagina): number {
    const porId = new Map(this.paginas().map(item => [item.id, item]));
    let nivel = 0;
    let parentId = pagina.parentId;
    while (parentId && porId.has(parentId)) {
      nivel++;
      parentId = porId.get(parentId)?.parentId;
    }
    return nivel;
  }

  private atualizarModulosPorProjeto(): void {
    const projetoId = this.filtros.controls.projetoId.value;
    this.modulos.set(
      projetoId ? this.todosModulos().filter(modulo => modulo.projetoId === projetoId) : this.todosModulos(),
    );

    const moduloId = this.filtros.controls.moduloId.value;
    if (moduloId && !this.modulos().some(modulo => modulo.id === moduloId)) {
      this.filtros.controls.moduloId.setValue('');
    }
  }

  private moverPagina(pagina: Pagina, parentId: string | undefined): void {
    const payload = {
      titulo: pagina.titulo,
      slug: pagina.slug,
      codigoTela: pagina.codigoTela,
      resumo: pagina.resumo,
      conteudoHtml: pagina.conteudoHtml,
      ordem: pagina.ordem,
      ativo: pagina.ativo,
      moduloId: pagina.moduloId,
      parentId,
      version: pagina.version,
    };
    this.paginaService.salvarPagina(payload, pagina.id).subscribe({
      next: () => {
        this.toast.success(parentId ? 'Página movida como subpágina.' : 'Página movida para a raiz.');
        this.carregar();
      },
      error: () => this.toast.error('Não foi possível mover a página.'),
    });
  }

  private complementarAncestros(paginas: Pagina[]): void {
    const ids = new Set(paginas.map(p => p.id));
    const faltando = new Set<string>();
    for (const pagina of paginas) {
      if (pagina.parentId && !ids.has(pagina.parentId)) {
        faltando.add(pagina.parentId);
      }
    }
    if (!faltando.size) return;

    forkJoin(
      [...faltando].map(id =>
        this.paginaService.pagina(id).pipe(catchError(() => of(null as Pagina | null))),
      ),
    ).subscribe({
      next: ancestors => {
        const validos = ancestors.filter((p): p is Pagina => p !== null);
        if (!validos.length) return;
        const merged = [...paginas];
        const mergedIds = new Set(paginas.map(p => p.id));
        for (const ancestor of validos) {
          if (!mergedIds.has(ancestor.id)) {
            merged.push(ancestor);
            mergedIds.add(ancestor.id);
          }
        }
        this.paginas.set(merged);
        this.complementarAncestros(merged);
      },
    });
  }

  private encontrarPaginaIndice(moduloId: string): string | undefined {
    const candidato = this.paginas().find(
      pagina =>
        pagina.moduloId === moduloId &&
        !pagina.parentId &&
        (/^operações$/i.test(pagina.titulo) ||
          /^(OPS|EXEMPLO-OPS|DF-PAGINAS|DF-ESTRUTURA|DF-REVISAO|DF-PUB|DF-REF|DF-CENTRAL)/i.test(
            pagina.codigoTela,
          ) ||
          (pagina.conteudoHtml?.includes('Guias disponíveis') ?? false)),
    );
    return candidato?.id;
  }

  private temFilhosNaLista(paginaId: string): boolean {
    return this.paginas().some(p => p.parentId === paginaId);
  }

  private mensagemArquivar(titulos: string[], comFilhos: boolean): string {
    const base =
      titulos.length === 1
        ? `A página "${titulos[0]}" sairá da listagem ativa.`
        : `Arquivar ${titulos.length} página(s)? Elas sairão da listagem ativa.`;
    if (comFilhos) {
      return `${base} As subpáginas vinculadas também serão arquivadas. Você pode restaurar depois pelo filtro "ARQUIVADO".`;
    }
    return `${base} Você pode restaurar depois pelo filtro "ARQUIVADO".`;
  }

  private compararPaginas = (a: Pagina, b: Pagina): number => {
    const comparacao = this.compararValores(
      this.valorOrdenacaoPagina(a, this.paginaSort),
      this.valorOrdenacaoPagina(b, this.paginaSort),
    );
    if (comparacao !== 0) {
      return this.paginaDir === 'DESC' ? -comparacao : comparacao;
    }
    return a.titulo.localeCompare(b.titulo);
  };

  private valorOrdenacaoPagina(pagina: Pagina, campo: string): string | number {
    switch (campo) {
      case 'modulo.projeto.nome':
        return pagina.projetoNome ?? '';
      case 'modulo.nome':
        return pagina.moduloNome ?? '';
      case 'parent.ordem':
        return pagina.parentTitulo ?? '';
      case 'ordem':
        return pagina.ordem ?? 0;
      case 'titulo':
        return pagina.titulo ?? '';
      case 'codigoTela':
        return pagina.codigoTela ?? '';
      case 'status':
        return pagina.status ?? '';
      case 'createdAt':
        return pagina.createdAt ?? '';
      case 'updatedAt':
        return pagina.updatedAt ?? '';
      default:
        return pagina.titulo ?? '';
    }
  }

  private compararValores(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b));
  }

  private atualizarUrl(): void {
    const raw = this.filtros.getRawValue();
    salvarFiltros('docflow:paginas', {
      busca: raw.busca.trim(),
      titulo: raw.titulo.trim(),
      codigoTela: raw.codigoTela.trim(),
      projetoId: raw.projetoId,
      moduloId: raw.moduloId,
      status: raw.status,
      sort: this.paginaSort,
      dir: this.paginaDir,
      pageSize: this.paginasPageSize(),
    });
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: compactQueryParams(
        {
          busca: raw.busca.trim() || null,
          titulo: raw.titulo.trim() || null,
          codigoTela: raw.codigoTela.trim() || null,
          projetoId: raw.projetoId || null,
          moduloId: raw.moduloId || null,
          status: raw.status || null,
          sort:
            this.paginaSort === 'modulo.projeto.nome' && this.paginaDir === 'ASC' ? null : this.paginaSort,
          dir: this.paginaSort === 'modulo.projeto.nome' && this.paginaDir === 'ASC' ? null : this.paginaDir,
          page: this.paginasPage(),
          size: this.paginasPageSize(),
        },
        { page: 1, size: 10 },
      ),
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected atalhosLista(event: KeyboardEvent): void {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (this.estaDigitando(event)) return;
      const input = document.querySelector<HTMLInputElement>('.paginas__search');
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    }
  }

  private estaDigitando(event: KeyboardEvent): boolean {
    const el = event.target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return el.isContentEditable;
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
}
