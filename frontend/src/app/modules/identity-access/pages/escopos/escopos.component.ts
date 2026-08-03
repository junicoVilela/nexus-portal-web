import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { EscopoAcesso, TipoAmbiente } from '@modules/identity-access/models/escopo-acesso.model';
import { GrupoAcesso } from '@modules/identity-access/models/grupo-acesso.model';
import { Usuario } from '@modules/identity-access/models/usuario.model';
import { EscopoService } from '@modules/identity-access/services/escopo.service';
import { GrupoService } from '@modules/identity-access/services/grupo.service';
import { UsuarioService } from '@modules/identity-access/services/usuario.service';
import { PermissaoDirective } from '@modules/identity-access/directives/permissao.directive';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  ConfirmService,
  PageHeaderComponent,
  ToastService,
} from '@shared/ui';

type Modo = 'usuario' | 'grupo';
type Origem = 'direto' | 'herdado';

interface EscopoView {
  escopo: EscopoAcesso;
  origem: Origem;
  /** Quando herdado, o nome do grupo de origem. */
  origemDescricao?: string;
}

const TIPOS_AMBIENTE: TipoAmbiente[] = ['DEV', 'HML', 'PRD', 'SIMULADO'];

@Component({
  selector: 'app-escopos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    PermissaoDirective,
  ],
  templateUrl: './escopos.component.html',
  styleUrl: './escopos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-form-page' },
})
export class EscoposComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly escopoService = inject(EscopoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly grupoService = inject(GrupoService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly TIPOS_AMBIENTE = TIPOS_AMBIENTE;

  protected readonly modo = signal<Modo>('usuario');
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly grupos = signal<GrupoAcesso[]>([]);
  protected readonly todosEscopos = signal<EscopoAcesso[]>([]);

  protected readonly selecionadoId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly mostraForm = signal(false);
  protected readonly editando = signal<EscopoAcesso | null>(null);

  readonly form = this.fb.nonNullable.group({
    clienteId: [''],
    ambienteId: [''],
    produtoId: [''],
    tipoAmbiente: [''],
    somenteLeitura: [false],
    ativo: [true],
  });

  protected readonly mapaGrupos = computed(() => {
    const m = new Map<string, GrupoAcesso>();
    this.grupos().forEach(g => m.set(g.id, g));
    return m;
  });

  protected readonly usuarioSel = computed<Usuario | undefined>(() => {
    if (this.modo() !== 'usuario') return undefined;
    return this.usuarios().find(u => u.id === this.selecionadoId());
  });

  protected readonly grupoSel = computed<GrupoAcesso | undefined>(() => {
    if (this.modo() !== 'grupo') return undefined;
    return this.grupos().find(g => g.id === this.selecionadoId());
  });

  protected readonly escoposVisiveis = computed<EscopoView[]>(() => {
    const id = this.selecionadoId();
    if (!id) return [];
    const todos = this.todosEscopos();
    if (this.modo() === 'usuario') {
      const usuario = this.usuarioSel();
      const diretos: EscopoView[] = todos
        .filter(e => e.usuarioId === id)
        .map(e => ({ escopo: e, origem: 'direto' }));
      const gruposIds = usuario?.grupoIds ?? [];
      const mapa = this.mapaGrupos();
      const herdados: EscopoView[] = todos
        .filter(e => e.grupoAcessoId && gruposIds.includes(e.grupoAcessoId))
        .map(e => ({
          escopo: e,
          origem: 'herdado',
          origemDescricao: mapa.get(e.grupoAcessoId!)?.nome ?? e.grupoAcessoId!,
        }));
      return [...diretos, ...herdados];
    } else {
      return todos.filter(e => e.grupoAcessoId === id).map(e => ({ escopo: e, origem: 'direto' }));
    }
  });

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      usuarios: this.usuarioService.listar({ size: 500 }),
      grupos: this.grupoService.listarTodos(),
      escopos: this.escopoService.listarTodos(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ usuarios, grupos, escopos }) => {
          this.usuarios.set(usuarios.items);
          this.grupos.set(grupos);
          this.todosEscopos.set(escopos);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar dados.'),
      });
  }

  alternarModo(modo: Modo): void {
    this.modo.set(modo);
    this.selecionadoId.set(null);
    this.fecharForm();
  }

  selecionar(id: string): void {
    this.selecionadoId.set(id);
    this.fecharForm();
  }

  abrirForm(e?: EscopoAcesso): void {
    if (!this.selecionadoId()) return;
    this.editando.set(e ?? null);
    this.form.reset(
      e
        ? {
            clienteId: e.clienteId ?? '',
            ambienteId: e.ambienteId ?? '',
            produtoId: e.produtoId ?? '',
            tipoAmbiente: e.tipoAmbiente ?? '',
            somenteLeitura: e.somenteLeitura,
            ativo: e.ativo,
          }
        : {
            clienteId: '',
            ambienteId: '',
            produtoId: '',
            tipoAmbiente: '',
            somenteLeitura: false,
            ativo: true,
          },
    );
    this.mostraForm.set(true);
  }

  fecharForm(): void {
    this.mostraForm.set(false);
    this.editando.set(null);
  }

  salvar(): void {
    if (this.form.invalid || this.saving() || !this.selecionadoId()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const tipo = raw.tipoAmbiente as TipoAmbiente | '';
    const base = {
      clienteId: raw.clienteId.trim() || undefined,
      ambienteId: raw.ambienteId.trim() || undefined,
      produtoId: raw.produtoId.trim() || undefined,
      tipoAmbiente: tipo || undefined,
      somenteLeitura: raw.somenteLeitura,
      ativo: raw.ativo,
    };
    const id = this.selecionadoId()!;
    const ed = this.editando();
    this.saving.set(true);
    const obs = ed
      ? this.escopoService.atualizar(ed.id, base)
      : this.escopoService.criar({
          ...base,
          usuarioId: this.modo() === 'usuario' ? id : undefined,
          grupoAcessoId: this.modo() === 'grupo' ? id : undefined,
        });
    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: salvo => {
        this.todosEscopos.update(list =>
          ed ? list.map(x => (x.id === salvo.id ? salvo : x)) : [salvo, ...list],
        );
        this.toast.success(ed ? 'Escopo atualizado.' : 'Escopo cadastrado.');
        this.fecharForm();
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao salvar escopo.'),
    });
  }

  toggleAtivo(e: EscopoAcesso): void {
    this.escopoService.alterarStatus(e.id, !e.ativo).subscribe({
      next: atu => {
        this.todosEscopos.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success(atu.ativo ? 'Escopo ativado.' : 'Escopo inativado.');
      },
      error: err => this.toast.error(err?.message ?? 'Erro ao alterar status.'),
    });
  }

  async remover(e: EscopoAcesso): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Remover escopo?',
      message: 'Esta ação não pode ser desfeita.',
      acceptLabel: 'Remover',
      variant: 'danger',
    });
    if (!ok) return;
    this.escopoService.remover(e.id).subscribe({
      next: () => {
        this.todosEscopos.update(list => list.filter(x => x.id !== e.id));
        this.toast.success('Escopo removido.');
      },
      error: err => this.toast.error(err?.message ?? 'Erro ao remover.'),
    });
  }

  descricaoEscopo(e: EscopoAcesso): string {
    const partes: string[] = [];
    if (e.clienteId) partes.push(`Cliente: ${e.clienteId}`);
    if (e.produtoId) partes.push(`Produto: ${e.produtoId}`);
    if (e.ambienteId) partes.push(`Ambiente: ${e.ambienteId}`);
    if (e.tipoAmbiente) partes.push(`Tipo: ${e.tipoAmbiente}`);
    return partes.length > 0 ? partes.join(' · ') : 'Escopo global (sem restrições)';
  }
}
