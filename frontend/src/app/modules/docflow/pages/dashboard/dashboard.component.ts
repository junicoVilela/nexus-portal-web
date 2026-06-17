import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ClienteService } from '@modules/docflow/services/cliente.service';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { Cliente } from '@modules/docflow/models/cliente.model';
import { Pagina, StatusPagina } from '@modules/docflow/models/pagina.model';
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
  protected readonly publicacoes = signal<Publicacao[]>([]);
  protected readonly ultimasPublicacoes = signal<Publicacao[]>([]);
  protected readonly totalHistoricoPublicacoes = signal(0);
  protected readonly paginasPendentes = signal<Pagina[]>([]);
  protected readonly publicacoesComErro = signal<Publicacao[]>([]);
  protected readonly publicacoesGerando = signal<Publicacao[]>([]);
  protected readonly clientesSemPublicacao = signal<Cliente[]>([]);
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
      situacao: 'Páginas pendentes de revisão / publicação',
      quantidade: this.paginasPendentes().length,
      acao: 'Revisar e publicar',
      destaque: this.paginasPendentes().length > 0,
    },
    {
      situacao: 'Publicações em andamento',
      quantidade: this.publicacoesGerando().length,
      acao: 'Aguardar conclusão',
      destaque: this.publicacoesGerando().length > 0,
    },
    {
      situacao: 'Publicações com falha',
      quantidade: this.publicacoesComErro().length,
      acao: 'Reprocessar',
      destaque: this.publicacoesComErro().length > 0,
    },
    {
      situacao: 'Clientes sem publicação ativa',
      quantidade: this.clientesSemPublicacao().length,
      acao: 'Gerar 1ª versão',
      destaque: this.clientesSemPublicacao().length > 0,
    },
  ]);

  private readonly toast = inject(ToastService);

  constructor(
    private readonly clienteService: ClienteService,
    private readonly projetoService: ProjetoService,
    private readonly moduloService: ModuloService,
    private readonly paginaService: PaginaService,
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
    this.route.queryParams.subscribe(params => {
      const state = readUrlState(params, this.urlSchema);
      this.ultimasPublicacoesPage.set(state.page);
      this.ultimasPublicacoesPageSize.set(state.size);
      this.historicoSort = state.sort;
      this.historicoDir = state.dir;
      forkJoin({
        clientes: this.clienteService.clientes(),
        projetos: this.projetoService.projetos(),
        modulos: this.moduloService.modulos(),
        paginas: this.paginaService.paginas(),
        publicacoes: this.publicacaoService.publicacoes(),
        historico: this.publicacaoService.listarPublicacoes({
          page: this.ultimasPublicacoesPage(),
          size: this.ultimasPublicacoesPageSize(),
          sort: this.historicoSort,
          dir: this.historicoDir,
        }),
      }).subscribe({
        next: ({ clientes, projetos, modulos, paginas, publicacoes, historico }) => {
          this.totalClientes.set(clientes.length);
          this.totalProjetos.set(projetos.length);
          this.totalModulos.set(modulos.length);
          this.totalPaginas.set(paginas.length);
          this.publicacoes.set(publicacoes);
          this.ultimasPublicacoes.set(historico.items);
          this.totalHistoricoPublicacoes.set(historico.totalItems);
          this.ultimasPublicacoesPage.set(historico.page);
          this.ultimasPublicacoesPageSize.set(historico.size);
          this.paginasPendentes.set(
            paginas.filter(p => ['RASCUNHO', 'EM_REVISAO', 'APROVADO'].includes(p.status)),
          );
          this.publicacoesComErro.set(publicacoes.filter(p => p.status === 'ERRO'));
          this.publicacoesGerando.set(publicacoes.filter(p => p.status === 'GERANDO'));
          const comPublicacao = new Set(
            publicacoes.filter(p => p.status === 'SUCESSO').map(p => p.clienteId),
          );
          this.clientesSemPublicacao.set(clientes.filter(c => c.ativo && !comPublicacao.has(c.id)));
          const contagem = new Map<string, number>();
          paginas.forEach(p => contagem.set(p.status, (contagem.get(p.status) ?? 0) + 1));
          this.statusStats.set(
            (['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO', 'ARQUIVADO'] as StatusPagina[])
              .map(s => ({ status: s, total: contagem.get(s) ?? 0 }))
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
