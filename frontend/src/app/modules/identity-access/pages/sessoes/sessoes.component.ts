import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { SessaoUsuario } from '@modules/identity-access/models/sessao.model';
import { Usuario } from '@modules/identity-access/models/usuario.model';
import { SessaoService } from '@modules/identity-access/services/sessao.service';
import { UsuarioService } from '@modules/identity-access/services/usuario.service';
import { PermissaoDirective } from '@modules/identity-access/directives/permissao.directive';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, ConfirmService, ToastService } from '@shared/ui';

@Component({
  selector: 'app-sessoes',
  standalone: true,
  imports: [
    DatePipe,
    ListPageComponent,
    TablePaginationComponent,
    BadgeComponent,
    ButtonComponent,
    PermissaoDirective,
  ],
  templateUrl: './sessoes.component.html',
  styleUrl: './sessoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessoesComponent implements OnInit {
  private readonly sessaoService = inject(SessaoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly sessoes = signal<SessaoUsuario[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);

  protected filtroUsuario = '';
  protected filtroAtiva: '' | 'true' | 'false' = 'true';

  protected readonly mapaUsuarios = computed(() => {
    const m = new Map<string, Usuario>();
    this.usuarios().forEach(u => m.set(u.id, u));
    return m;
  });

  ngOnInit(): void {
    this.usuarioService.listar({ size: 500 }).subscribe({
      next: r => this.usuarios.set(r.items),
      error: e => this.toast.error(e?.message ?? 'Erro ao carregar usuários.'),
    });
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.sessaoService
      .listar({
        usuarioId: this.filtroUsuario || undefined,
        ativa: this.filtroAtiva === '' ? undefined : this.filtroAtiva === 'true',
        page: this.page(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: r => {
          this.sessoes.set(r.items);
          this.total.set(r.totalItems);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar sessões.'),
      });
  }

  alterarUsuario(value: string): void {
    this.filtroUsuario = value;
    this.page.set(1);
    this.carregar();
  }

  alterarAtiva(value: string): void {
    this.filtroAtiva = value as '' | 'true' | 'false';
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

  nomeUsuario(usuarioId: string): string {
    return this.mapaUsuarios().get(usuarioId)?.nome ?? '(removido)';
  }

  truncarUa(ua: string | null, limite = 60): string {
    if (!ua) return '—';
    return ua.length > limite ? ua.slice(0, limite) + '…' : ua;
  }

  async revogar(s: SessaoUsuario): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Revogar sessão?',
      message: `Encerrar a sessão de ${this.nomeUsuario(s.usuarioId)} iniciada em ${new Date(s.iniciadaEm).toLocaleString()}.`,
      acceptLabel: 'Revogar',
      variant: 'danger',
    });
    if (!ok) return;
    this.sessaoService.revogar(s.id).subscribe({
      next: atu => {
        this.sessoes.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success('Sessão revogada.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao revogar.'),
    });
  }
}
