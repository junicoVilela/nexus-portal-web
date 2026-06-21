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

import { AMBIENTE_LABELS, Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';

interface ClienteFiltros {
  q: string;
  ativo: 'todos' | 'ativos' | 'inativos';
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-clientes-list',
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
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesListComponent implements OnInit {
  private readonly service = inject(ClienteService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly page = signal(1);
  protected readonly excluindoId = signal<string | null>(null);

  protected filtros: ClienteFiltros = { q: '', ativo: 'todos' };
  protected debounceHandle?: ReturnType<typeof setTimeout>;

  protected readonly ambienteLabels = AMBIENTE_LABELS;

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / PAGE_SIZE)),
  );

  ngOnInit(): void {
    const salvos = carregarFiltros<ClienteFiltros>('release-orchestrator:clientes');
    if (salvos) this.filtros = { ...this.filtros, ...salvos };
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    const ativo =
      this.filtros.ativo === 'ativos' ? true : this.filtros.ativo === 'inativos' ? false : undefined;
    this.service.listar(this.page(), PAGE_SIZE, this.filtros.q || undefined, ativo).subscribe({
      next: r => {
        this.clientes.set(r.items);
        this.totalItems.set(r.totalItems);
        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar a lista de clientes.');
        this.clientes.set([]);
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

  protected onStatusChange(): void {
    this.page.set(1);
    this.persistirFiltros();
    this.carregar();
  }

  protected irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.page.set(p);
    this.carregar();
  }

  protected toggleAtivo(c: Cliente): void {
    this.service.alterarStatus(c.id, !c.ativo).subscribe({
      next: upd => this.clientes.update(list => list.map(x => (x.id === upd.id ? upd : x))),
      error: () => undefined,
    });
  }

  protected excluir(c: Cliente): void {
    this.service.excluir(c.id).subscribe({
      next: () => {
        this.clientes.update(list => list.filter(x => x.id !== c.id));
        this.totalItems.update(t => Math.max(0, t - 1));
        this.excluindoId.set(null);
      },
      error: () => {
        this.excluindoId.set(null);
        this.erro.set('Não foi possível excluir o cliente. Remova contratos vinculados antes.');
      },
    });
  }

  private persistirFiltros(): void {
    salvarFiltros('release-orchestrator:clientes', this.filtros);
  }

  protected formatarCnpj(cnpj?: string): string {
    if (!cnpj || cnpj.length !== 14) return cnpj || '—';
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
  }
}
