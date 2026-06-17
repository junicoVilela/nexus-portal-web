import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { Auditoria } from '@modules/seguranca/models/auditoria.model';
import { Usuario } from '@modules/seguranca/models/usuario.model';
import { AuditoriaService } from '@modules/seguranca/services/auditoria.service';
import { UsuarioService } from '@modules/seguranca/services/usuario.service';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [DatePipe, ListPageComponent, TablePaginationComponent, BadgeComponent],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaComponent implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);

  protected readonly registros = signal<Auditoria[]>([]);
  protected readonly acoes = signal<string[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly expandido = signal<Set<string>>(new Set());

  protected busca = '';
  protected filtroUsuario = '';
  protected filtroAcao = '';
  protected filtroResultado: '' | 'SUCESSO' | 'FALHA' = '';
  protected dataInicio = '';
  protected dataFim = '';

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
    this.acoes.set(this.auditoriaService.acoes());
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.auditoriaService
      .listar({
        q: this.busca.trim() || undefined,
        usuarioId: this.filtroUsuario || undefined,
        acao: this.filtroAcao || undefined,
        resultado: this.filtroResultado || undefined,
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
          this.acoes.set(this.auditoriaService.acoes());
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar auditoria.'),
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

  alterarAcao(value: string): void {
    this.filtroAcao = value;
    this.page.set(1);
    this.carregar();
  }

  alterarResultado(value: string): void {
    this.filtroResultado = value as '' | 'SUCESSO' | 'FALHA';
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

  toggleExpandir(id: string): void {
    this.expandido.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  estaExpandido(id: string): boolean {
    return this.expandido().has(id);
  }

  nomeUsuario(reg: Auditoria): string {
    if (!reg.usuarioId) return reg.usuarioLogin ?? '(sistema)';
    return this.mapaUsuarios().get(reg.usuarioId)?.nome ?? reg.usuarioLogin ?? '(removido)';
  }

  formatarJson(obj: Record<string, unknown> | null): string {
    if (!obj) return '—';
    return JSON.stringify(obj, null, 2);
  }
}
