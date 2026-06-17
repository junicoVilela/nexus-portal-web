import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import {
  Release,
  RELEASE_STATUS_LABELS,
  RELEASE_TIPO_LABELS,
  ReleaseStatus,
} from '../../../models/release.model';
import { ReleaseService } from '../../../services/release.service';
import { ProdutoService } from '../../../services/produto.service';
import { ReleasePdfService } from '../../../services/release-pdf.service';
import { Produto } from '../../../models/produto.model';
import { ListPageComponent } from '@shared/layouts';
import {
  BulkActionBarComponent,
  ButtonComponent,
  ConfirmService,
  ErrorStateComponent,
  ErrorVariant,
  FilterPresetsComponent,
} from '@shared/ui';
import type { FilterPreset } from '@shared/utils/filter-presets';
import { carregarFiltros, salvarFiltros } from '@shared/utils/persisted-filters';
import { classificarErro } from '@shared/utils/error-classifier';
import { ReleaseStatusBadgeComponent } from '../../../components/release-status-badge';
import { ReleaseCompareComponent } from '../../../components/release-compare';

@Component({
  selector: 'app-releases-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    TablePaginationComponent,
    ListPageComponent,
    ButtonComponent,
    ErrorStateComponent,
    FilterPresetsComponent,
    ReleaseStatusBadgeComponent,
    ReleaseCompareComponent,
    BulkActionBarComponent,
  ],
  templateUrl: './releases-list.component.html',
  styleUrl: './releases-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleasesListComponent implements OnInit, OnDestroy {
  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly releases = signal<Release[]>([]);
  protected readonly produtos = signal<Produto[]>([]);

  protected readonly totalItems = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(15);

  protected readonly comparandoIds = signal<{ left: string; right: string } | null>(null);
  protected readonly selecionados = signal<Set<string>>(new Set());
  protected readonly totalSelecionados = computed(() => this.selecionados().size);
  protected readonly todosVisiveisSelecionados = computed(() => {
    const list = this.releases();
    const sel = this.selecionados();
    return list.length > 0 && list.every(r => sel.has(r.id));
  });
  protected readonly podeComparar = computed(() => this.totalSelecionados() === 2);

  protected readonly statusLabels = RELEASE_STATUS_LABELS;
  protected readonly tipoLabels = RELEASE_TIPO_LABELS;

  protected filtros = {
    q: '',
    produtoId: '',
    status: '' as ReleaseStatus | '',
    tipo: '',
    dataPrevistaInicio: '',
    dataPrevistaFim: '',
    dataPublicacaoInicio: '',
    dataPublicacaoFim: '',
  };

  protected readonly mostrarFiltrosAvancados = signal(false);
  protected readonly filtrosAtivos = computed(() => {
    const f = this.filtrosSignal();
    let n = 0;
    if (f.q) n++;
    if (f.produtoId) n++;
    if (f.status) n++;
    if (f.tipo) n++;
    if (f.dataPrevistaInicio || f.dataPrevistaFim) n++;
    if (f.dataPublicacaoInicio || f.dataPublicacaoFim) n++;
    return n;
  });
  private readonly filtrosSignal = signal(this.filtros);
  private readonly busca$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  protected readonly todosStatus = Object.keys(RELEASE_STATUS_LABELS) as ReleaseStatus[];
  protected readonly confirmandoId = signal<string | null>(null);
  protected readonly excluindoId = signal<string | null>(null);

  private readonly confirmService = inject(ConfirmService);

  constructor(
    private readonly releaseService: ReleaseService,
    private readonly produtoService: ProdutoService,
    private readonly pdfService: ReleasePdfService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const persistidos = carregarFiltros<typeof this.filtros>('release-orchestrator:releases');
    if (persistidos) this.filtros = { ...this.filtros, ...persistidos };
    this.filtrosSignal.set({ ...this.filtros });
    this.busca$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.executarBusca(true));
    this.carregarProdutos();
    this.executarBusca(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarProdutos(): void {
    this.produtoService.listarTodos().subscribe({
      next: p => this.produtos.set(p),
      error: () => undefined /* feedback via errorInterceptor */,
    });
  }

  protected buscar(resetPage = true): void {
    this.executarBusca(resetPage);
  }

  protected agendarBusca(): void {
    this.busca$.next();
  }

  private executarBusca(resetPage: boolean): void {
    if (resetPage) this.page.set(1);
    this.loading.set(true);
    this.erro.set(null);
    this.filtrosSignal.set({ ...this.filtros });
    salvarFiltros('release-orchestrator:releases', this.filtros);
    this.releaseService
      .listar({
        ...this.filtros,
        status: this.filtros.status || undefined,
        page: this.page(),
        size: this.pageSize(),
      })
      .subscribe({
        next: r => {
          this.releases.set(r.items);
          this.totalItems.set(r.totalItems);
          this.loading.set(false);
        },
        error: err => {
          this.erroVariant.set(classificarErro(err));
          this.erro.set('Não foi possível carregar a lista de releases.');
          this.releases.set([]);
          this.totalItems.set(0);
          this.loading.set(false);
        },
      });
  }

  protected onPageChange(p: number): void {
    this.page.set(p);
    this.executarBusca(false);
  }

  protected limparFiltros(): void {
    this.filtros = {
      q: '',
      produtoId: '',
      status: '',
      tipo: '',
      dataPrevistaInicio: '',
      dataPrevistaFim: '',
      dataPublicacaoInicio: '',
      dataPublicacaoFim: '',
    };
    this.buscar();
  }

  protected toggleAvancados(): void {
    this.mostrarFiltrosAvancados.update(v => !v);
  }

  protected aplicarPreset(preset: FilterPreset<Record<string, unknown>>): void {
    this.filtros = { ...this.filtros, ...(preset.filtros as typeof this.filtros) };
    this.buscar();
  }

  protected duplicar(rel: Release): void {
    this.releaseService.duplicar(rel.id).subscribe({
      next: nova => this.router.navigate(['/release-orchestrator/releases', nova.id]),
      error: () => undefined /* feedback via errorInterceptor */,
    });
  }

  protected cancelar(rel: Release): void {
    this.releaseService.cancelar(rel.id).subscribe({
      next: upd => {
        this.releases.update(list => list.map(r => (r.id === upd.id ? upd : r)));
        this.confirmandoId.set(null);
      },
      error: () => this.confirmandoId.set(null),
    });
  }

  protected podeExcluir(rel: Release): boolean {
    return rel.status !== 'PUBLICADA';
  }

  protected toggleSelecionado(id: string): void {
    this.selecionados.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected toggleSelecionarTodos(): void {
    const todos = this.todosVisiveisSelecionados();
    this.selecionados.update(set => {
      const next = new Set(set);
      for (const r of this.releases()) {
        if (todos) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  }

  protected limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  protected compararSelecionados(): void {
    const ids = [...this.selecionados()];
    if (ids.length !== 2) return;
    this.comparandoIds.set({ left: ids[0]!, right: ids[1]! });
  }

  protected fecharComparacao(): void {
    this.comparandoIds.set(null);
  }

  protected async cancelarSelecionados(): Promise<void> {
    const ids = [...this.selecionados()];
    const list = this.releases().filter(
      r => ids.includes(r.id) && r.status !== 'CANCELADA' && r.status !== 'PUBLICADA',
    );
    if (list.length === 0) return;
    const ok = await this.confirmService.confirm({
      title: 'Cancelar releases?',
      message: `Cancelar ${list.length} release(s) selecionada(s)? Esta ação não pode ser desfeita.`,
      acceptLabel: 'Cancelar releases',
      variant: 'danger',
      icon: 'XCircle',
    });
    if (!ok) return;
    for (const rel of list) {
      this.releaseService.cancelar(rel.id).subscribe({
        next: upd => this.releases.update(curr => curr.map(r => (r.id === upd.id ? upd : r))),
        error: () => undefined /* feedback via errorInterceptor */,
      });
    }
    this.limparSelecao();
  }

  protected async excluirSelecionados(): Promise<void> {
    const ids = [...this.selecionados()];
    const list = this.releases().filter(r => ids.includes(r.id) && this.podeExcluir(r));
    if (list.length === 0) return;
    const ok = await this.confirmService.confirm({
      title: 'Excluir releases?',
      message: `Excluir ${list.length} release(s) permanentemente? Releases publicadas não serão removidas.`,
      acceptLabel: 'Excluir',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!ok) return;
    for (const rel of list) {
      this.releaseService.excluir(rel.id).subscribe({
        next: () => {
          this.releases.update(curr => curr.filter(r => r.id !== rel.id));
          this.totalItems.update(n => Math.max(0, n - 1));
        },
        error: () => undefined /* feedback via errorInterceptor */,
      });
    }
    this.limparSelecao();
  }

  protected iniciarCancelamento(id: string): void {
    this.excluindoId.set(null);
    this.confirmandoId.set(id);
  }

  protected iniciarExclusao(id: string): void {
    this.confirmandoId.set(null);
    this.excluindoId.set(id);
  }

  protected excluir(rel: Release): void {
    this.releaseService.excluir(rel.id).subscribe({
      next: () => {
        this.releases.update(list => list.filter(r => r.id !== rel.id));
        this.totalItems.update(n => Math.max(0, n - 1));
        this.excluindoId.set(null);
      },
      error: () => {
        this.excluindoId.set(null);
        this.erro.set('Não foi possível excluir a release. Releases publicadas não podem ser removidas.');
      },
    });
  }

  protected gerarPdf(rel: Release): void {
    this.pdfService.download(rel.id, 'INTERNO', `${rel.produtoSigla}-${rel.versao}.pdf`);
  }
}
