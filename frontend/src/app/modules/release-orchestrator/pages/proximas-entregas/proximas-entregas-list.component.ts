import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin } from 'rxjs';

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

import { AMBIENTE_LABELS, Cliente } from '../../models/cliente.model';
import {
  PRIORIDADE_LABELS,
  PRIORIDADE_TONES,
  ProximaEntrega,
  STATUS_PE_LABELS,
  STATUS_PE_TONES,
  StatusProximaEntrega,
  TRANSICOES_PE,
} from '../../models/proxima-entrega.model';
import { Produto } from '../../models/produto.model';
import { ClienteService } from '../../services/cliente.service';
import { ProdutoService } from '../../services/produto.service';
import { ProximaEntregaService } from '../../services/proxima-entrega.service';

interface AgendaFiltros {
  clienteId: string;
  produtoId: string;
  status: StatusProximaEntrega | '';
  dataDe: string;
  dataAte: string;
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-proximas-entregas-list',
  standalone: true,
  imports: [
    DatePipe,
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
  templateUrl: './proximas-entregas-list.component.html',
  styleUrl: './proximas-entregas-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProximasEntregasListComponent implements OnInit {
  private readonly service = inject(ProximaEntregaService);
  private readonly clienteService = inject(ClienteService);
  private readonly produtoService = inject(ProdutoService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly entregas = signal<ProximaEntrega[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly page = signal(1);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly produtos = signal<Produto[]>([]);
  protected readonly alterandoStatusId = signal<string | null>(null);

  protected filtros: AgendaFiltros = {
    clienteId: '',
    produtoId: '',
    status: '',
    dataDe: '',
    dataAte: '',
  };

  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly prioridadeLabels = PRIORIDADE_LABELS;
  protected readonly prioridadeTones = PRIORIDADE_TONES;
  protected readonly statusLabels = STATUS_PE_LABELS;
  protected readonly statusTones = STATUS_PE_TONES;
  protected readonly statusKeys = Object.keys(STATUS_PE_LABELS) as StatusProximaEntrega[];
  protected readonly transicoes = TRANSICOES_PE;

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / PAGE_SIZE)),
  );

  ngOnInit(): void {
    const salvos = carregarFiltros<AgendaFiltros>('release-orchestrator:proximas-entregas');
    if (salvos) this.filtros = { ...this.filtros, ...salvos };
    this.carregarReferencias();
    this.carregar();
  }

  private carregarReferencias(): void {
    forkJoin({
      clientes: this.clienteService.listar(1, 100, undefined, true),
      produtos: this.produtoService.listar(1, 100),
    }).subscribe({
      next: ({ clientes, produtos }) => {
        this.clientes.set(clientes.items);
        this.produtos.set(produtos.items);
      },
      error: () => undefined,
    });
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this.service
      .listar(this.page(), PAGE_SIZE, {
        clienteId: this.filtros.clienteId || undefined,
        produtoId: this.filtros.produtoId || undefined,
        status: this.filtros.status || undefined,
        dataDe: this.filtros.dataDe || undefined,
        dataAte: this.filtros.dataAte || undefined,
      })
      .subscribe({
        next: r => {
          this.entregas.set(r.items);
          this.totalItems.set(r.totalItems);
          this.loading.set(false);
        },
        error: err => {
          this.erroVariant.set(classificarErro(err));
          this.erro.set('Não foi possível carregar as próximas entregas.');
          this.entregas.set([]);
          this.loading.set(false);
        },
      });
  }

  protected onFiltroChange(): void {
    this.page.set(1);
    salvarFiltros('release-orchestrator:proximas-entregas', this.filtros);
    this.carregar();
  }

  protected limparFiltros(): void {
    this.filtros = { clienteId: '', produtoId: '', status: '', dataDe: '', dataAte: '' };
    this.onFiltroChange();
  }

  protected irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.page.set(p);
    this.carregar();
  }

  protected proximoStatus(pe: ProximaEntrega): StatusProximaEntrega | null {
    const proximos = this.transicoes[pe.status];
    if (pe.status === 'PLANEJADA') return 'AGENDADA';
    if (pe.status === 'AGENDADA') return 'CONVERTIDA';
    return proximos[0] ?? null;
  }

  protected avancarStatus(pe: ProximaEntrega): void {
    const novo = this.proximoStatus(pe);
    if (!novo) return;
    this.alterandoStatusId.set(pe.id);
    this.service.alterarStatus(pe.id, novo).subscribe({
      next: upd => {
        this.entregas.update(list => list.map(x => (x.id === upd.id ? upd : x)));
        this.alterandoStatusId.set(null);
        this.toast.success(`Status atualizado para ${this.statusLabels[novo]}.`);
      },
      error: () => {
        this.alterandoStatusId.set(null);
        this.toast.error('Não foi possível alterar o status.');
      },
    });
  }

  protected cancelar(pe: ProximaEntrega): void {
    if (!this.transicoes[pe.status].includes('CANCELADA')) return;
    this.alterandoStatusId.set(pe.id);
    this.service.alterarStatus(pe.id, 'CANCELADA').subscribe({
      next: upd => {
        this.entregas.update(list => list.map(x => (x.id === upd.id ? upd : x)));
        this.alterandoStatusId.set(null);
        this.toast.success('Entrega cancelada.');
      },
      error: () => {
        this.alterandoStatusId.set(null);
        this.toast.error('Não foi possível cancelar.');
      },
    });
  }

  protected estaAtrasada(pe: ProximaEntrega): boolean {
    if (pe.status === 'CONVERTIDA' || pe.status === 'CANCELADA') return false;
    return pe.dataPrevista < new Date().toISOString().slice(0, 10);
  }
}
