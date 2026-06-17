import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize, forkJoin } from 'rxjs';
import { HistoricoLogin } from '@modules/seguranca/models/historico-login.model';
import { Usuario } from '@modules/seguranca/models/usuario.model';
import { HistoricoLoginService } from '@modules/seguranca/services/historico-login.service';
import { UsuarioService } from '@modules/seguranca/services/usuario.service';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-historico-login',
  standalone: true,
  imports: [DatePipe, ListPageComponent, TablePaginationComponent, BadgeComponent],
  templateUrl: './historico-login.component.html',
  styleUrl: './historico-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoLoginComponent implements OnInit {
  private readonly historicoService = inject(HistoricoLoginService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);

  protected readonly registros = signal<HistoricoLogin[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);

  protected busca = '';
  protected filtroUsuario = '';
  protected filtroSucesso: '' | 'true' | 'false' = '';
  protected dataInicio = '';
  protected dataFim = '';

  protected readonly mapaUsuarios = computed(() => {
    const m = new Map<string, Usuario>();
    this.usuarios().forEach(u => m.set(u.id, u));
    return m;
  });

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      usuarios: this.usuarioService.listar({ size: 500 }),
    }).subscribe({
      next: ({ usuarios }) => this.usuarios.set(usuarios.items),
      error: e => this.toast.error(e?.message ?? 'Erro ao carregar usuários.'),
    });
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.historicoService
      .listar({
        q: this.busca.trim() || undefined,
        usuarioId: this.filtroUsuario || undefined,
        sucesso: this.filtroSucesso === '' ? undefined : this.filtroSucesso === 'true',
        inicio: this.dataInicio || undefined,
        fim: this.dataFim || undefined,
        page: this.page(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: r => {
          this.registros.set(r.items);
          this.total.set(r.totalItems);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar histórico.'),
      });
  }

  aplicarBusca(event: Event): void {
    this.busca = (event.target as HTMLInputElement).value;
    this.page.set(1);
    this.carregar();
  }

  alterarUsuario(value: string): void {
    this.filtroUsuario = value;
    this.page.set(1);
    this.carregar();
  }

  alterarSucesso(value: string): void {
    this.filtroSucesso = value as '' | 'true' | 'false';
    this.page.set(1);
    this.carregar();
  }

  alterarInicio(value: string): void {
    this.dataInicio = value;
    this.page.set(1);
    this.carregar();
  }

  alterarFim(value: string): void {
    this.dataFim = value;
    this.page.set(1);
    this.carregar();
  }

  alterarPagina(p: number): void {
    this.page.set(p);
    this.carregar();
  }

  alterarPageSize(s: number): void {
    this.pageSize.set(s);
    this.page.set(1);
    this.carregar();
  }

  nomeUsuario(usuarioId: string | null): string {
    if (!usuarioId) return '—';
    return this.mapaUsuarios().get(usuarioId)?.nome ?? '(removido)';
  }

  truncarUa(ua: string | null, limite = 50): string {
    if (!ua) return '—';
    return ua.length > limite ? ua.slice(0, limite) + '…' : ua;
  }
}
