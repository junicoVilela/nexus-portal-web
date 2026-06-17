import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { AcessoTemporario, AcessoTemporarioStatus } from '@modules/seguranca/models/acesso-temporario.model';
import { GrupoAcesso } from '@modules/seguranca/models/grupo-acesso.model';
import { Permissao } from '@modules/seguranca/models/permissao.model';
import { Usuario } from '@modules/seguranca/models/usuario.model';
import { AcessoTemporarioService } from '@modules/seguranca/services/acesso-temporario.service';
import { GrupoService } from '@modules/seguranca/services/grupo.service';
import { PermissaoService } from '@modules/seguranca/services/permissao.service';
import { UsuarioService } from '@modules/seguranca/services/usuario.service';
import { PermissaoDirective } from '@modules/seguranca/directives/permissao.directive';
import { TablePaginationComponent } from '@shared/components/table-pagination/table-pagination.component';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, CardComponent, ConfirmService, ToastService } from '@shared/ui';

@Component({
  selector: 'app-acessos-temporarios',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ListPageComponent,
    TablePaginationComponent,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    PermissaoDirective,
  ],
  templateUrl: './acessos-temporarios.component.html',
  styleUrl: './acessos-temporarios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcessosTemporariosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AcessoTemporarioService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly grupoService = inject(GrupoService);
  private readonly permissaoService = inject(PermissaoService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly acessos = signal<AcessoTemporario[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly grupos = signal<GrupoAcesso[]>([]);
  protected readonly permissoes = signal<Permissao[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly mostraForm = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);

  protected filtroUsuario = '';
  protected filtroStatus: '' | AcessoTemporarioStatus = '';

  readonly form = this.fb.nonNullable.group({
    usuarioId: ['', Validators.required],
    grupoAcessoId: [''],
    permissaoId: [''],
    inicioEm: ['', Validators.required],
    fimEm: ['', Validators.required],
    justificativa: [''],
  });

  protected readonly mapaUsuarios = computed(() => {
    const m = new Map<string, Usuario>();
    this.usuarios().forEach(u => m.set(u.id, u));
    return m;
  });

  protected readonly mapaGrupos = computed(() => {
    const m = new Map<string, GrupoAcesso>();
    this.grupos().forEach(g => m.set(g.id, g));
    return m;
  });

  protected readonly mapaPermissoes = computed(() => {
    const m = new Map<string, Permissao>();
    this.permissoes().forEach(p => m.set(p.id, p));
    return m;
  });

  ngOnInit(): void {
    forkJoin({
      usuarios: this.usuarioService.listar({ size: 500 }),
      grupos: this.grupoService.listarTodos(),
      permissoes: this.permissaoService.listarTodos(),
    }).subscribe({
      next: ({ usuarios, grupos, permissoes }) => {
        this.usuarios.set(usuarios.items);
        this.grupos.set(grupos);
        this.permissoes.set(permissoes);
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao carregar dados auxiliares.'),
    });
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.service
      .listar({
        usuarioId: this.filtroUsuario || undefined,
        status: this.filtroStatus || undefined,
        page: this.page(),
        size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: r => {
          this.acessos.set(r.items);
          this.total.set(r.totalItems);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar acessos.'),
      });
  }

  abrirForm(): void {
    this.form.reset({
      usuarioId: '',
      grupoAcessoId: '',
      permissaoId: '',
      inicioEm: '',
      fimEm: '',
      justificativa: '',
    });
    this.mostraForm.set(true);
  }

  fecharForm(): void {
    this.mostraForm.set(false);
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.grupoAcessoId && !raw.permissaoId) {
      this.toast.error('Informe um grupo OU uma permissão temporária.');
      return;
    }
    this.saving.set(true);
    this.service
      .criar({
        usuarioId: raw.usuarioId,
        grupoAcessoId: raw.grupoAcessoId || undefined,
        permissaoId: raw.permissaoId || undefined,
        inicioEm: new Date(raw.inicioEm).toISOString(),
        fimEm: new Date(raw.fimEm).toISOString(),
        justificativa: raw.justificativa.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: novo => {
          this.acessos.update(list => [novo, ...list]);
          this.total.update(t => t + 1);
          this.fecharForm();
          this.toast.success('Acesso temporário concedido.');
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao conceder acesso.'),
      });
  }

  async revogar(a: AcessoTemporario): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Revogar acesso temporário?',
      message: `Encerrar o acesso de ${this.nomeUsuario(a.usuarioId)} antes da data de fim.`,
      acceptLabel: 'Revogar',
      variant: 'danger',
    });
    if (!ok) return;
    this.service.revogar(a.id).subscribe({
      next: atu => {
        this.acessos.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success('Acesso revogado.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao revogar.'),
    });
  }

  alterarUsuario(value: string): void {
    this.filtroUsuario = value;
    this.page.set(1);
    this.carregar();
  }

  alterarStatus(value: string): void {
    this.filtroStatus = value as '' | AcessoTemporarioStatus;
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

  nomeUsuario(id: string): string {
    return this.mapaUsuarios().get(id)?.nome ?? '(removido)';
  }

  descricaoAcesso(a: AcessoTemporario): string {
    const partes: string[] = [];
    if (a.grupoAcessoId)
      partes.push(`Grupo: ${this.mapaGrupos().get(a.grupoAcessoId)?.nome ?? a.grupoAcessoId}`);
    if (a.permissaoId)
      partes.push(`Permissão: ${this.mapaPermissoes().get(a.permissaoId)?.codigo ?? a.permissaoId}`);
    return partes.join(' · ');
  }

  toneStatus(s: AcessoTemporarioStatus): 'success' | 'warn' | 'danger' | 'neutral' {
    switch (s) {
      case 'ATIVO':
        return 'success';
      case 'AGENDADO':
        return 'warn';
      case 'REVOGADO':
        return 'danger';
      case 'EXPIRADO':
      default:
        return 'neutral';
    }
  }
}
