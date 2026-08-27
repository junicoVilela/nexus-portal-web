import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import {
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ErrorVariant,
  PageHeaderComponent,
  SkeletonComponent,
  ToastService,
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';
import { carregarFiltros, salvarFiltros } from '@shared/utils/persisted-filters';
import { AuthService } from '@core/auth/services/auth.service';

import {
  AMBIENTE_INSTALACAO_LABELS,
  AmbienteInstalacao,
  InstalacaoCliente,
  STATUS_INSTALACAO_LABELS,
  StatusInstalacao,
  TIPO_IMPLANTACAO_LABELS,
  TipoImplantacao,
  HEALTH_INSTALACAO_LABELS,
  HealthInstalacao,
} from '../../models/instalacao-cliente.model';
import { InstalacaoClienteService } from '../../services/instalacao-cliente.service';
import { agruparInstalacoesPorSite, GrupoInstalacaoSite } from './instalacao-produto-aba.util';

interface InstalacaoFiltros {
  q: string;
  tipo: 'todos' | TipoImplantacao;
  status: 'todos' | StatusInstalacao;
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-instalacoes-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './instalacoes-list.component.html',
  styleUrl: './instalacoes-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstalacoesListComponent implements OnInit {
  private readonly service = inject(InstalacaoClienteService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly itens = signal<InstalacaoCliente[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly page = signal(1);
  protected readonly excluindoId = signal<string | null>(null);
  protected readonly cicloId = signal<string | null>(null);
  protected readonly cicloOp = signal<'INICIAR' | 'PARAR' | null>(null);
  protected readonly podeEditar = computed(() => this.auth.tem()('INSTALACAO:EDITAR'));

  protected filtros: InstalacaoFiltros = { q: '', tipo: 'todos', status: 'todos' };
  protected debounceHandle?: ReturnType<typeof setTimeout>;

  protected readonly tipoLabels = TIPO_IMPLANTACAO_LABELS;
  protected readonly statusLabels = STATUS_INSTALACAO_LABELS;
  protected readonly healthLabels = HEALTH_INSTALACAO_LABELS;
  protected readonly ambienteLabels = AMBIENTE_INSTALACAO_LABELS;
  protected readonly tipos = Object.keys(TIPO_IMPLANTACAO_LABELS) as TipoImplantacao[];
  protected readonly statuses = Object.keys(STATUS_INSTALACAO_LABELS) as StatusInstalacao[];

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalItems() / PAGE_SIZE)));
  protected readonly grupos = computed(() => agruparInstalacoesPorSite(this.itens()));

  ngOnInit(): void {
    const salvos = carregarFiltros<InstalacaoFiltros>('release-orchestrator:instalacoes');
    if (salvos) this.filtros = { ...this.filtros, ...salvos };
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    const tipo = this.filtros.tipo === 'todos' ? undefined : this.filtros.tipo;
    const status = this.filtros.status === 'todos' ? undefined : this.filtros.status;
    this.service.listar(this.page(), PAGE_SIZE, this.filtros.q || undefined, undefined, undefined, undefined, tipo, status).subscribe({
      next: r => {
        this.itens.set(r.items);
        this.totalItems.set(r.totalItems);
        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar a lista de instalações.');
        this.itens.set([]);
        this.loading.set(false);
      },
    });
  }

  protected onBuscaInput(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => {
      this.page.set(1);
      this.persistirFiltros();
      this.carregar();
    }, 300);
  }

  protected onFiltroChange(): void {
    this.page.set(1);
    this.persistirFiltros();
    this.carregar();
  }

  protected irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.page.set(p);
    this.carregar();
  }

  protected principal(grupo: GrupoInstalacaoSite<InstalacaoCliente>): InstalacaoCliente {
    return grupo.produtos[0];
  }

  protected siteUnico(grupo: GrupoInstalacaoSite<InstalacaoCliente>): boolean {
    return grupo.produtos.length === 1;
  }

  protected statusGrupo(grupo: GrupoInstalacaoSite<InstalacaoCliente>): StatusInstalacao {
    if (grupo.produtos.some(p => p.status === 'ATIVA')) return 'ATIVA';
    if (grupo.produtos.every(p => p.status === 'INATIVA')) return 'INATIVA';
    return this.principal(grupo).status;
  }

  protected healthGrupo(grupo: GrupoInstalacaoSite<InstalacaoCliente>): HealthInstalacao {
    const ordem: HealthInstalacao[] = ['INDISPONIVEL', 'DEGRADADO', 'DESCONHECIDO', 'SAUDAVEL'];
    for (const h of ordem) {
      if (grupo.produtos.some(p => (p.health ?? 'DESCONHECIDO') === h)) return h;
    }
    return 'DESCONHECIDO';
  }

  protected erroGrupo(grupo: GrupoInstalacaoSite<InstalacaoCliente>): string | undefined {
    return grupo.produtos.map(p => p.ultimoErro).find(e => !!e);
  }

  protected ambienteGrupo(grupo: GrupoInstalacaoSite<InstalacaoCliente>): AmbienteInstalacao {
    return grupo.ambiente as AmbienteInstalacao;
  }

  protected tipoGrupo(grupo: GrupoInstalacaoSite<InstalacaoCliente>): TipoImplantacao {
    return grupo.tipoImplantacao as TipoImplantacao;
  }

  protected proximoStatus(atual: StatusInstalacao): StatusInstalacao {
    if (atual === 'INEXISTENTE' || atual === 'INATIVA') return 'ATIVA';
    return 'INATIVA';
  }

  protected rotuloStatusAction(atual: StatusInstalacao): string {
    return atual === 'ATIVA' ? 'Inativar' : 'Ativar';
  }

  protected podeCicloVida(item: InstalacaoCliente): boolean {
    return (
      this.podeEditar()
      && item.status !== 'INEXISTENTE'
      && (item.tipoImplantacao === 'DOCKER_PULL' || item.tipoImplantacao === 'LINUX_MANUAL')
    );
  }

  protected executarCiclo(item: InstalacaoCliente, operacao: 'INICIAR' | 'PARAR'): void {
    if (this.cicloId()) {
      return;
    }
    this.cicloId.set(item.id);
    this.cicloOp.set(operacao);
    const req$ = operacao === 'INICIAR' ? this.service.iniciar(item.id) : this.service.parar(item.id);
    req$.subscribe({
      next: d => {
        this.cicloId.set(null);
        this.cicloOp.set(null);
        if (d.status === 'FALHA') {
          this.toast.error(d.erro ?? (operacao === 'INICIAR' ? 'Falha ao iniciar.' : 'Falha ao parar.'));
          return;
        }
        this.toast.success(d.mensagem ?? (operacao === 'INICIAR' ? 'Ambiente iniciado.' : 'Ambiente parado.'));
        this.service.buscar(item.id).subscribe({
          next: upd => this.itens.update(list => list.map(x => (x.id === upd.id ? upd : x))),
        });
      },
      error: err => {
        this.cicloId.set(null);
        this.cicloOp.set(null);
        const msg = err?.error?.message ?? (operacao === 'INICIAR' ? 'Não foi possível iniciar.' : 'Não foi possível parar.');
        this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível executar start/stop.');
      },
    });
  }

  protected toggleStatus(item: InstalacaoCliente): void {
    const proximo = this.proximoStatus(item.status);
    this.service.alterarStatus(item.id, proximo).subscribe({
      next: upd => this.itens.update(list => list.map(x => (x.id === upd.id ? upd : x))),
      error: () => undefined,
    });
  }

  protected excluir(item: InstalacaoCliente): void {
    this.service.excluir(item.id).subscribe({
      next: () => {
        this.itens.update(list => list.filter(x => x.id !== item.id));
        this.totalItems.update(t => Math.max(0, t - 1));
        this.excluindoId.set(null);
      },
      error: () => {
        this.excluindoId.set(null);
        this.erro.set('Não foi possível excluir a instalação.');
      },
    });
  }

  protected tomStatus(status: StatusInstalacao): 'success' | 'warn' | 'neutral' {
    if (status === 'ATIVA') return 'success';
    if (status === 'INEXISTENTE') return 'warn';
    return 'neutral';
  }

  protected tomHealth(health?: HealthInstalacao): 'success' | 'warn' | 'danger' | 'neutral' {
    if (health === 'SAUDAVEL') return 'success';
    if (health === 'DEGRADADO') return 'warn';
    if (health === 'INDISPONIVEL') return 'danger';
    return 'neutral';
  }

  private persistirFiltros(): void {
    salvarFiltros('release-orchestrator:instalacoes', this.filtros);
  }
}
