import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Usuario } from '@modules/identity-access/models/usuario.model';
import { GrupoAcesso } from '@modules/identity-access/models/grupo-acesso.model';
import { UsuarioService } from '@modules/identity-access/services/usuario.service';
import { GrupoService } from '@modules/identity-access/services/grupo.service';
import { PermissaoDirective } from '@modules/identity-access/directives/permissao.directive';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, ConfirmService, ToastService } from '@shared/ui';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [ListPageComponent, TablePaginationComponent, BadgeComponent, ButtonComponent, PermissaoDirective],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosListComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly grupoService = inject(GrupoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly grupos = signal<GrupoAcesso[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected busca = '';
  protected filtroAtivo: '' | 'true' | 'false' = '';
  protected filtroBloqueado: '' | 'true' | 'false' = '';

  protected readonly mapaGrupos = computed(() => {
    const m = new Map<string, string>();
    this.grupos().forEach(g => m.set(g.id, g.nome));
    return m;
  });

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      grupos: this.grupoService.listarTodos(),
      pagina: this.usuarioService.listar({
        page: this.page(),
        size: this.pageSize(),
      }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ grupos, pagina }) => {
          this.grupos.set(grupos);
          this.usuarios.set(pagina.items);
          this.total.set(pagina.totalItems);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar.'),
      });
  }

  /** Recarrega apenas a página de usuários (grupos não mudam entre interações). */
  carregar(): void {
    this.loading.set(true);
    this.usuarioService
      .listar({
        q: this.busca.trim() || undefined,
        ativo: this.filtroAtivo === '' ? undefined : this.filtroAtivo === 'true',
        bloqueado: this.filtroBloqueado === '' ? undefined : this.filtroBloqueado === 'true',
        page: this.page(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: r => {
          this.usuarios.set(r.items);
          this.total.set(r.totalItems);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar usuários.'),
      });
  }

  novo(): void {
    this.router.navigate(['/seguranca/usuarios/novo']);
  }

  editar(u: Usuario): void {
    this.router.navigate(['/seguranca/usuarios', u.id, 'editar']);
  }

  aplicarBusca(event: Event): void {
    this.busca = (event.target as HTMLInputElement).value;
    this.page.set(1);
    this.carregar();
  }

  alterarAtivo(value: string): void {
    this.filtroAtivo = value as '' | 'true' | 'false';
    this.page.set(1);
    this.carregar();
  }

  alterarBloqueado(value: string): void {
    this.filtroBloqueado = value as '' | 'true' | 'false';
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

  async toggleAtivo(u: Usuario): Promise<void> {
    const ok = await this.confirm.confirm({
      title: u.ativo ? 'Inativar usuário?' : 'Ativar usuário?',
      message: `Deseja ${u.ativo ? 'inativar' : 'ativar'} ${u.nome}?`,
      acceptLabel: u.ativo ? 'Inativar' : 'Ativar',
      variant: u.ativo ? 'danger' : 'primary',
    });
    if (!ok) return;
    this.usuarioService.alterarStatus(u.id, !u.ativo).subscribe({
      next: atu => {
        this.usuarios.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success(atu.ativo ? 'Usuário ativado.' : 'Usuário inativado.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao alterar status.'),
    });
  }

  async toggleBloqueio(u: Usuario): Promise<void> {
    const ok = await this.confirm.confirm({
      title: u.bloqueado ? 'Desbloquear usuário?' : 'Bloquear usuário?',
      message: `Deseja ${u.bloqueado ? 'desbloquear' : 'bloquear'} ${u.nome}?`,
      acceptLabel: u.bloqueado ? 'Desbloquear' : 'Bloquear',
      variant: u.bloqueado ? 'primary' : 'danger',
    });
    if (!ok) return;
    this.usuarioService.bloquear(u.id, !u.bloqueado).subscribe({
      next: atu => {
        this.usuarios.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success(atu.bloqueado ? 'Usuário bloqueado.' : 'Usuário desbloqueado.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao alterar bloqueio.'),
    });
  }

  async resetarSenha(u: Usuario): Promise<void> {
    const novaSenha = prompt(`Nova senha provisória para ${u.nome}:`);
    if (!novaSenha) return;
    if (novaSenha.length < 4) {
      this.toast.error('Senha precisa ter ao menos 4 caracteres.');
      return;
    }
    this.usuarioService.resetarSenha(u.id, novaSenha).subscribe({
      next: () => this.toast.success('Senha resetada. Usuário deverá trocá-la no próximo login.'),
      error: e => this.toast.error(e?.message ?? 'Erro ao resetar senha.'),
    });
  }

  nomesGrupos(u: Usuario): string {
    if (!u.grupoIds?.length) return '—';
    const m = this.mapaGrupos();
    return u.grupoIds.map(id => m.get(id) ?? id).join(', ');
  }
}
