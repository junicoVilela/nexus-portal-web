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
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';
import { carregarFiltros, salvarFiltros } from '@shared/utils/persisted-filters';

import {
  Host,
  SISTEMA_OPERACIONAL_LABELS,
  SistemaOperacionalHost,
  TIPO_CONEXAO_LABELS,
} from '../../models/host.model';
import { HostService } from '../../services/host.service';

interface HostFiltros {
  q: string;
  ativo: 'todos' | 'ativos' | 'inativos';
  so: 'todos' | SistemaOperacionalHost;
  docker: 'todos' | 'sim' | 'nao';
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-hosts-list',
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
  templateUrl: './hosts-list.component.html',
  styleUrl: './hosts-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostsListComponent implements OnInit {
  private readonly service = inject(HostService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly hosts = signal<Host[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly page = signal(1);
  protected readonly excluindoId = signal<string | null>(null);

  protected filtros: HostFiltros = { q: '', ativo: 'todos', so: 'todos', docker: 'todos' };
  protected debounceHandle?: ReturnType<typeof setTimeout>;

  protected readonly soLabels = SISTEMA_OPERACIONAL_LABELS;
  protected readonly conexaoLabels = TIPO_CONEXAO_LABELS;

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.totalItems() / PAGE_SIZE)));

  ngOnInit(): void {
    const salvos = carregarFiltros<HostFiltros>('release-orchestrator:hosts');
    if (salvos) this.filtros = { ...this.filtros, ...salvos };
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    const ativo =
      this.filtros.ativo === 'ativos' ? true : this.filtros.ativo === 'inativos' ? false : undefined;
    const so = this.filtros.so === 'todos' ? undefined : this.filtros.so;
    const docker = this.filtros.docker === 'sim' ? true : this.filtros.docker === 'nao' ? false : undefined;
    this.service.listar(this.page(), PAGE_SIZE, this.filtros.q || undefined, ativo, so, docker).subscribe({
      next: r => {
        this.hosts.set(r.items);
        this.totalItems.set(r.totalItems);
        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar a lista de hosts.');
        this.hosts.set([]);
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

  protected toggleAtivo(h: Host): void {
    this.service.alterarStatus(h.id, !h.ativo).subscribe({
      next: upd => this.hosts.update(list => list.map(x => (x.id === upd.id ? upd : x))),
      error: () => undefined,
    });
  }

  protected excluir(h: Host): void {
    this.service.excluir(h.id).subscribe({
      next: () => {
        this.hosts.update(list => list.filter(x => x.id !== h.id));
        this.totalItems.update(t => Math.max(0, t - 1));
        this.excluindoId.set(null);
      },
      error: () => {
        this.excluindoId.set(null);
        this.erro.set('Não foi possível excluir o host. Remova instalações vinculadas antes.');
      },
    });
  }

  private persistirFiltros(): void {
    salvarFiltros('release-orchestrator:hosts', this.filtros);
  }
}
