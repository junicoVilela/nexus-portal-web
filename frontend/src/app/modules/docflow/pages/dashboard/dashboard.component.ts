import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DocFlowDashboardResumo } from '@modules/docflow/models/dashboard.model';
import { DocFlowDashboardService } from '@modules/docflow/services/docflow-dashboard.service';
import { AiFeatureService } from '@modules/docflow/services/ai-feature.service';
import { briefingDaLacuna } from '@modules/docflow/utils/lacuna-briefing.util';
import { AuthService } from '@core/auth/services/auth.service';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { StatusPagina } from '@modules/docflow/models/pagina.model';
import { Publicacao } from '@modules/docflow/models/publicacao.model';
import { compactQueryParams, SortDirection } from '@shared/utils/query-state';
import { parseEnum, parseInt10, parseString, readUrlState } from '@shared/utils/url-state.util';
import {
  BadgeComponent,
  CardComponent,
  KpiCardComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/ui';

interface FilaItem {
  situacao: string;
  quantidade: number;
  acao: string;
  destaque: boolean;
  route: string[];
  queryParams?: Record<string, string>;
}
interface StatusStat {
  status: StatusPagina;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    TablePaginationComponent,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    KpiCardComponent,
    RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly totalClientes = signal(0);
  protected readonly totalProjetos = signal(0);
  protected readonly totalModulos = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly totalPublicacoes = signal(0);
  protected readonly ultimasPublicacoes = signal<Publicacao[]>([]);
  protected readonly totalHistoricoPublicacoes = signal(0);
  protected readonly paginasPendentes = signal(0);
  protected readonly paginasEmRevisao = signal(0);
  protected readonly publicacoesComErro = signal(0);
  protected readonly publicacoesGerando = signal(0);
  protected readonly clientesSemPublicacao = signal(0);
  protected readonly paginasSemResumo = signal(0);
  protected readonly paginasDesatualizadas = signal(0);
  protected readonly paginasDesatualizadasPorRelease = signal(0);
  protected readonly lacunas = signal<DocFlowDashboardResumo['lacunas'] | null>(null);
  private readonly auth = inject(AuthService);
  private readonly aiFeature = inject(AiFeatureService);
  /** Lacuna vira página: só com o assistente ligado e permissão de gerar. */
  protected readonly podeCriarComIa = computed(
    () => this.aiFeature.disponivel() && this.auth.tem()('PAGINA:AI_GERAR'),
  );
  protected readonly briefingDaLacuna = briefingDaLacuna;
  protected readonly taxaSucessoPublicacoes = signal(0);
  protected readonly statusStats = signal<StatusStat[]>([]);

  protected filaOperacionalSort = 'quantidade';
  protected filaOperacionalDir: SortDirection = 'DESC';
  protected statusStatsSort = 'total';
  protected statusStatsDir: SortDirection = 'DESC';
  protected readonly ultimasPublicacoesPage = signal(1);
  protected readonly ultimasPublicacoesPageSize = signal(10);
  protected historicoSort = 'createdAt';
  protected historicoDir: SortDirection = 'DESC';

  protected readonly filaOperacional = computed<FilaItem[]>(() => [
    {
      situacao: 'Páginas aguardando revisão',
      quantidade: this.paginasEmRevisao(),
      acao: 'Abrir central de revisão',
      destaque: this.paginasEmRevisao() > 0,
      route: ['/doc-flow/revisoes'],
    },
    {
      situacao: 'Publicações em andamento',
      quantidade: this.publicacoesGerando(),
      acao: 'Aguardar conclusão',
      destaque: this.publicacoesGerando() > 0,
      route: ['/doc-flow/publicacoes'],
      queryParams: { status: 'GERANDO' },
    },
    {
      situacao: 'Publicações com falha',
      quantidade: this.publicacoesComErro(),
      acao: 'Reprocessar',
      destaque: this.publicacoesComErro() > 0,
      route: ['/doc-flow/publicacoes'],
      queryParams: { status: 'ERRO' },
    },
    {
      situacao: 'Clientes sem publicação ativa',
      quantidade: this.clientesSemPublicacao(),
      acao: 'Gerar 1ª versão',
      destaque: this.clientesSemPublicacao() > 0,
      route: ['/doc-flow/publicacoes/novo'],
    },
  ]);

  private readonly toast = inject(ToastService);

  constructor(
    private readonly dashboardService: DocFlowDashboardService,
    private readonly publicacaoService: PublicacaoService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  private readonly urlSchema = {
    defaults: { page: 1, size: 10, sort: 'createdAt', dir: 'DESC' as SortDirection },
    parsers: {
      page: parseInt10(1),
      size: parseInt10(10),
      sort: parseString('createdAt'),
      dir: parseEnum<SortDirection>(['ASC', 'DESC'], 'DESC') as (raw: string | null) => SortDirection,
    },
  };

  ngOnInit(): void {
    this.aiFeature.ensureLoaded();
    this.route.queryParams.subscribe(params => {
      const state = readUrlState(params, this.urlSchema);
      this.ultimasPublicacoesPage.set(state.page);
      this.ultimasPublicacoesPageSize.set(state.size);
      this.historicoSort = state.sort;
      this.historicoDir = state.dir;
      forkJoin({
        resumo: this.dashboardService.resumo(),
        historico: this.publicacaoService.listarPublicacoes({
          page: this.ultimasPublicacoesPage(),
          size: this.ultimasPublicacoesPageSize(),
          sort: this.historicoSort,
          dir: this.historicoDir,
        }),
      }).subscribe({
        next: ({ resumo, historico }) => {
          this.totalClientes.set(resumo.totalClientes);
          this.totalProjetos.set(resumo.totalProjetos);
          this.totalModulos.set(resumo.totalModulos);
          this.totalPaginas.set(resumo.totalPaginas);
          this.totalPublicacoes.set(resumo.totalPublicacoes);
          this.ultimasPublicacoes.set(historico.items);
          this.totalHistoricoPublicacoes.set(historico.totalItems);
          this.ultimasPublicacoesPage.set(historico.page);
          this.ultimasPublicacoesPageSize.set(historico.size);
          this.paginasPendentes.set(resumo.paginasPendentes);
          this.paginasEmRevisao.set(resumo.paginasEmRevisao);
          this.publicacoesComErro.set(resumo.publicacoesComErro);
          this.publicacoesGerando.set(resumo.publicacoesGerando);
          this.clientesSemPublicacao.set(resumo.clientesSemPublicacao);
          this.paginasSemResumo.set(resumo.paginasSemResumo);
          this.paginasDesatualizadas.set(resumo.paginasDesatualizadas);
          this.paginasDesatualizadasPorRelease.set(resumo.paginasDesatualizadasPorRelease ?? 0);
          this.lacunas.set(resumo.lacunas ?? null);
          this.taxaSucessoPublicacoes.set(resumo.taxaSucessoPublicacoes);
          this.statusStats.set(
            (['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO', 'ARQUIVADO'] as StatusPagina[])
              .map(s => ({ status: s, total: resumo.paginasPorStatus[s] ?? 0 }))
              .filter(s => s.total > 0),
          );
        },
        error: () => this.toast.error('Não foi possível carregar o dashboard.'),
      });
    });
  }

  get filaOperacionalOrdenada(): FilaItem[] {
    return this.sortFilaOperacional();
  }
  get statusStatsOrdenados(): StatusStat[] {
    return this.sortStatusStats();
  }

  alterarPaginaHistorico(page: number): void {
    this.ultimasPublicacoesPage.set(page);
    this.atualizarUrl();
  }

  alterarTamanhoPaginaHistorico(size: number): void {
    this.ultimasPublicacoesPageSize.set(size);
    this.ultimasPublicacoesPage.set(1);
    this.atualizarUrl();
  }

  ordenarHistorico(campo: string): void {
    if (this.historicoSort === campo) {
      this.historicoDir = this.historicoDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.historicoSort = campo;
      this.historicoDir = 'ASC';
    }
    this.ultimasPublicacoesPage.set(1);
    this.atualizarUrl();
  }

  indicacaoOrdenacaoHistorico(campo: string): string {
    if (this.historicoSort !== campo) return '↕';
    return this.historicoDir === 'ASC' ? '↑' : '↓';
  }

  ordenarFila(campo: string): void {
    if (this.filaOperacionalSort === campo) {
      this.filaOperacionalDir = this.filaOperacionalDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filaOperacionalSort = campo;
      this.filaOperacionalDir = 'ASC';
    }
  }

  indicacaoOrdenacaoFila(campo: string): string {
    if (this.filaOperacionalSort !== campo) return '↕';
    return this.filaOperacionalDir === 'ASC' ? '↑' : '↓';
  }

  ordenarStatus(campo: string): void {
    if (this.statusStatsSort === campo) {
      this.statusStatsDir = this.statusStatsDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.statusStatsSort = campo;
      this.statusStatsDir = 'ASC';
    }
  }

  indicacaoOrdenacaoStatus(campo: string): string {
    if (this.statusStatsSort !== campo) return '↕';
    return this.statusStatsDir === 'ASC' ? '↑' : '↓';
  }

  private atualizarUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: compactQueryParams(
        {
          page: this.ultimasPublicacoesPage(),
          size: this.ultimasPublicacoesPageSize(),
          sort:
            this.historicoSort === 'createdAt' && this.historicoDir === 'DESC' ? null : this.historicoSort,
          dir: this.historicoSort === 'createdAt' && this.historicoDir === 'DESC' ? null : this.historicoDir,
        },
        { page: 1, size: 10 },
      ),
    });
  }

  private sortFilaOperacional(): FilaItem[] {
    return [...this.filaOperacional()].sort((a, b) => {
      const comparacao = this.compararValores(
        this.valorFila(a, this.filaOperacionalSort),
        this.valorFila(b, this.filaOperacionalSort),
      );
      return this.filaOperacionalDir === 'DESC' ? -comparacao : comparacao;
    });
  }

  private sortStatusStats(): StatusStat[] {
    return [...this.statusStats()].sort((a, b) => {
      const comparacao = this.compararValores(
        this.valorStatus(a, this.statusStatsSort),
        this.valorStatus(b, this.statusStatsSort),
      );
      return this.statusStatsDir === 'DESC' ? -comparacao : comparacao;
    });
  }

  private valorFila(item: FilaItem, campo: string): string | number {
    switch (campo) {
      case 'situacao':
        return item.situacao;
      case 'acao':
        return item.acao;
      case 'quantidade':
      default:
        return item.quantidade;
    }
  }

  private valorStatus(item: StatusStat, campo: string): string | number {
    switch (campo) {
      case 'status':
        return item.status;
      case 'total':
      default:
        return item.total;
    }
  }

  private compararValores(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b));
  }
}
