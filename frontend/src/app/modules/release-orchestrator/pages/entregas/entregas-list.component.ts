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
  Entrega,
  formatarTamanho,
  STATUS_ENTREGA_LABELS,
  STATUS_ENTREGA_TONES,
  StatusEntrega,
} from '../../models/entrega.model';
import { Produto } from '../../models/produto.model';
import { ClienteService } from '../../services/cliente.service';
import { EntregaService } from '../../services/entrega.service';
import { ProdutoService } from '../../services/produto.service';

interface EntregaFiltrosUi {
  clienteId: string;
  produtoId: string;
  status: StatusEntrega | '';
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-entregas-list',
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
  templateUrl: './entregas-list.component.html',
  styleUrl: './entregas-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregasListComponent implements OnInit {
  private readonly service = inject(EntregaService);
  private readonly clienteService = inject(ClienteService);
  private readonly produtoService = inject(ProdutoService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly entregas = signal<Entrega[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly page = signal(1);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly produtos = signal<Produto[]>([]);
  protected readonly reentregandoId = signal<string | null>(null);

  protected filtros: EntregaFiltrosUi = { clienteId: '', produtoId: '', status: '' };

  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly statusLabels = STATUS_ENTREGA_LABELS;
  protected readonly statusTones = STATUS_ENTREGA_TONES;
  protected readonly statusKeys = Object.keys(STATUS_ENTREGA_LABELS) as StatusEntrega[];
  protected readonly formatarTamanho = formatarTamanho;

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / PAGE_SIZE)),
  );

  ngOnInit(): void {
    const salvos = carregarFiltros<EntregaFiltrosUi>('release-orchestrator:entregas');
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
      })
      .subscribe({
        next: r => {
          this.entregas.set(r.items);
          this.totalItems.set(r.totalItems);
          this.loading.set(false);
        },
        error: err => {
          this.erroVariant.set(classificarErro(err));
          this.erro.set('Não foi possível carregar o histórico de entregas.');
          this.entregas.set([]);
          this.loading.set(false);
        },
      });
  }

  protected onFiltroChange(): void {
    this.page.set(1);
    salvarFiltros('release-orchestrator:entregas', this.filtros);
    this.carregar();
  }

  protected limparFiltros(): void {
    this.filtros = { clienteId: '', produtoId: '', status: '' };
    this.onFiltroChange();
  }

  protected irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.page.set(p);
    this.carregar();
  }

  protected reentregar(e: Entrega): void {
    this.reentregandoId.set(e.id);
    this.service.reentregar(e.id).subscribe({
      next: nova => {
        this.reentregandoId.set(null);
        this.toast.success('Reentrega criada como RASCUNHO.');
        this.entregas.update(list => [nova, ...list]);
        this.totalItems.update(t => t + 1);
      },
      error: () => {
        this.reentregandoId.set(null);
        this.toast.error('Não foi possível criar a reentrega.');
      },
    });
  }
}
