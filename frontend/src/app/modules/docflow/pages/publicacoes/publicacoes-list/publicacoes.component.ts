import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { TIMINGS } from '@core/config/timings';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Publicacao } from '@modules/docflow/models/publicacao.model';
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
import { BadgeComponent, ButtonComponent, ConfirmService, MoreActionsComponent, ToastService } from '@shared/ui';
import { PermissaoDirective } from '@modules/seguranca/directives';

@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [
    AuditStampComponent,
    TablePaginationComponent,
    ListPageComponent,
    ButtonComponent,
    BadgeComponent,
    MoreActionsComponent,
    PermissaoDirective,
  ],
  templateUrl: './publicacoes.component.html',
  styleUrl: './publicacoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacoesComponent implements OnInit, OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly publicacoes = signal<Publicacao[]>([]);
  protected readonly totalPublicacoes = signal(0);
  protected readonly publicacoesPage = signal(1);
  protected readonly publicacoesPageSize = signal(10);
  protected publicacaoSort = 'createdAt';
  protected publicacaoDir: SortDirection = 'DESC';
  protected readonly loadingHistory = signal(false);
  protected readonly excluindoId = signal<string | null>(null);
  protected readonly statusFiltro = signal<Publicacao['status'] | ''>('');
  protected readonly reprocessandoFalhas = signal(false);
  protected readonly publicacoesVisiveis = computed(() => this.publicacoes());
  protected readonly falhasVisiveis = computed(() =>
    this.publicacoes().filter(item => item.status === 'ERRO'),
  );
  private refreshTimer?: number;
  private eventosSubscription?: Subscription;

  constructor(
    private readonly publicacaoService: PublicacaoService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const temQueryParams = params.keys.length > 0;
      const persistidos = temQueryParams
        ? null
        : carregarFiltros<{
            sort: string;
            dir: SortDirection;
            pageSize: number;
          }>('docflow:publicacoes');
      this.publicacaoSort = params.get('sort') ?? persistidos?.sort ?? 'createdAt';
      this.publicacaoDir = parseSortDirection(params.get('dir') ?? persistidos?.dir ?? null, 'DESC');
      const status = params.get('status');
      this.statusFiltro.set(status === 'GERANDO' || status === 'SUCESSO' || status === 'ERRO' ? status : '');
      this.publicacoesPage.set(parsePositiveInt(params.get('page'), 1));
      this.publicacoesPageSize.set(parsePositiveInt(params.get('size'), persistidos?.pageSize ?? 10));
      this.carregar();
    });
    this.eventosSubscription = this.publicacaoService.eventosPublicacao().subscribe({
      next: () => this.carregar(),
      error: () => this.ativarPollingReserva(),
      complete: () => this.ativarPollingReserva(),
    });
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    this.eventosSubscription?.unsubscribe();
  }

  private ativarPollingReserva(): void {
    if (this.refreshTimer) return;
    this.refreshTimer = window.setInterval(() => {
      if (!document.hidden && this.publicacoes().some(item => item.status === 'GERANDO')) this.carregar();
    }, TIMINGS.publicacoesPollIntervalMs);
  }

  carregar(): void {
    this.loadingHistory.set(true);
    this.publicacaoService
      .listarPublicacoes({
        page: this.publicacoesPage(),
        size: this.publicacoesPageSize(),
        sort: this.publicacaoSort,
        dir: this.publicacaoDir,
        status: this.statusFiltro() || undefined,
      })
      .pipe(finalize(() => this.loadingHistory.set(false)))
      .subscribe({
        next: response => {
          this.publicacoes.set(response.items);
          this.totalPublicacoes.set(response.totalItems);
          this.publicacoesPage.set(response.page);
          this.publicacoesPageSize.set(response.size);
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao carregar publicações.')),
      });
  }

  nova(): void {
    this.router.navigate(docFlowRouterCommands(['publicacoes', 'novo']));
  }

  baixar(item: Publicacao): void {
    if (!this.podeBaixar(item)) return;
    this.publicacaoService.baixarPublicacao(item.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.arquivoZipNome ?? `manual-${item.versao}.zip`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: error => this.toast.error(this.errorMessage(error, 'Erro ao baixar pacote.')),
    });
  }

  podeBaixar(item: Publicacao): boolean {
    return item.status === 'SUCESSO' && !!item.arquivoZipNome;
  }

  reprocessar(item: Publicacao): void {
    this.publicacaoService.reprocessarPublicacao(item.id).subscribe({
      next: () => {
        this.toast.success('Publicação reenviada para geração.');
        this.carregar();
      },
      error: error => this.toast.error(this.errorMessage(error, 'Erro ao reprocessar publicação.')),
    });
  }

  async reprocessarFalhas(): Promise<void> {
    const falhas = this.falhasVisiveis();
    if (!falhas.length || this.reprocessandoFalhas()) return;
    const confirmado = await this.confirm.confirm({
      title: 'Reprocessar publicações com falha?',
      message: `${falhas.length} publicação(ões) desta página serão reenviadas para geração.`,
      acceptLabel: 'Reprocessar falhas',
      icon: 'RotateCcw',
    });
    if (!confirmado) return;
    this.reprocessandoFalhas.set(true);
    this.publicacaoService
      .reprocessarPublicacoes(falhas.map(item => item.id))
      .pipe(finalize(() => this.reprocessandoFalhas.set(false)))
      .subscribe({
        next: resultado => {
          this.toast.success(
            `${resultado.reprocessadas} publicação(ões) reenviada(s)` +
              (resultado.ignoradas ? `; ${resultado.ignoradas} já estavam em geração.` : '.'),
          );
          this.statusFiltro.set('GERANDO');
          this.atualizarUrl();
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao reprocessar as publicações.')),
      });
  }

  alterarFiltroStatus(status: string): void {
    this.statusFiltro.set(status === 'GERANDO' || status === 'SUCESSO' || status === 'ERRO' ? status : '');
    this.atualizarUrl();
  }

  async excluir(item: Publicacao): Promise<void> {
    if (item.status === 'GERANDO' || this.excluindoId()) return;
    const confirmado = await this.confirm.confirm({
      title: 'Excluir publicação?',
      message: `A publicação ${item.versao} de ${item.clienteNome}, seu histórico e o pacote ZIP serão excluídos permanentemente.`,
      acceptLabel: 'Excluir publicação',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;

    this.excluindoId.set(item.id);
    this.publicacaoService
      .excluirPublicacao(item.id)
      .pipe(finalize(() => this.excluindoId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Publicação excluída.');
          if (this.publicacoes().length === 1 && this.publicacoesPage() > 1) {
            this.publicacoesPage.update(page => page - 1);
            this.atualizarUrl();
            return;
          }
          this.carregar();
        },
        error: error => this.toast.error(this.errorMessage(error, 'Erro ao excluir publicação.')),
      });
  }

  abrirDetalhe(item: Publicacao): void {
    void this.router.navigate(docFlowRouterCommands(['publicacoes', item.id, 'detalhe']));
  }

  copiarLinkPublicoZip(item: Publicacao): void {
    if (!this.podeBaixar(item)) return;
    this.publicacaoService.tokenDownloadPacote(item.id).subscribe({
      next: token => {
        const url = this.publicacaoService.montarUrlDownloadPacotePublico(token.token, token.urlPath);
        navigator.clipboard
          .writeText(url)
          .then(() => {
            this.toast.success(`Link público temporário copiado (válido ${token.validadeSegundos}s).`);
          })
          .catch(() => this.toast.error('Não foi possível copiar para a área de transferência.'));
      },
      error: error => this.toast.error(this.errorMessage(error, 'Erro ao emitir token de download.')),
    });
  }

  alterarPagina(page: number): void {
    this.publicacoesPage.set(page);
    this.atualizarUrl();
  }

  alterarTamanhoPagina(size: number): void {
    this.publicacoesPageSize.set(size);
    this.publicacoesPage.set(1);
    this.atualizarUrl();
  }

  ordenar(campo: string): void {
    if (this.publicacaoSort === campo) {
      this.publicacaoDir = this.publicacaoDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.publicacaoSort = campo;
      this.publicacaoDir = 'ASC';
    }
    this.publicacoesPage.set(1);
    this.atualizarUrl();
  }

  indicacaoOrdenacao(campo: string): string {
    if (this.publicacaoSort !== campo) return '↕';
    return this.publicacaoDir === 'ASC' ? '↑' : '↓';
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
    salvarFiltros('docflow:publicacoes', {
      sort: this.publicacaoSort,
      dir: this.publicacaoDir,
      pageSize: this.publicacoesPageSize(),
    });
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: compactQueryParams(
        {
          sort:
            this.publicacaoSort === 'createdAt' && this.publicacaoDir === 'DESC' ? null : this.publicacaoSort,
          dir:
            this.publicacaoSort === 'createdAt' && this.publicacaoDir === 'DESC' ? null : this.publicacaoDir,
          page: this.publicacoesPage(),
          size: this.publicacoesPageSize(),
          status: this.statusFiltro() || null,
        },
        { page: 1, size: 10 },
      ),
    });
  }
}
