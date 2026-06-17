import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { Dominio } from '@modules/seguranca/models/dominio.model';
import { Funcionalidade } from '@modules/seguranca/models/funcionalidade.model';
import { Permissao } from '@modules/seguranca/models/permissao.model';
import { DominioService } from '@modules/seguranca/services/dominio.service';
import { FuncionalidadeService } from '@modules/seguranca/services/funcionalidade.service';
import { PermissaoService } from '@modules/seguranca/services/permissao.service';
import { PermissaoDirective } from '@modules/seguranca/directives/permissao.directive';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/ui';

@Component({
  selector: 'app-matriz-seguranca',
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
  templateUrl: './matriz.component.html',
  styleUrl: './matriz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-form-page' },
})
export class MatrizComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dominioService = inject(DominioService);
  private readonly funcionalidadeService = inject(FuncionalidadeService);
  private readonly permissaoService = inject(PermissaoService);
  private readonly toast = inject(ToastService);

  protected readonly dominios = signal<Dominio[]>([]);
  protected readonly funcionalidades = signal<Funcionalidade[]>([]);
  protected readonly permissoes = signal<Permissao[]>([]);

  protected readonly dominioSelId = signal<string | null>(null);
  protected readonly funcionalidadeSelId = signal<string | null>(null);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly mostraFormDominio = signal(false);
  protected readonly mostraFormFunc = signal(false);
  protected readonly mostraFormPerm = signal(false);

  protected readonly editDominio = signal<Dominio | null>(null);
  protected readonly editFunc = signal<Funcionalidade | null>(null);
  protected readonly editPerm = signal<Permissao | null>(null);

  readonly formDominio = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
    descricao: [''],
    ativo: [true],
  });

  readonly formFunc = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
    descricao: [''],
    ativo: [true],
  });

  readonly formPerm = this.fb.nonNullable.group({
    acao: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
    descricao: [''],
    ativo: [true],
  });

  protected readonly funcionalidadesDoDominio = computed<Funcionalidade[]>(() => {
    const id = this.dominioSelId();
    if (!id) return [];
    return this.funcionalidades().filter(f => f.dominioId === id);
  });

  protected readonly permissoesDaFuncionalidade = computed<Permissao[]>(() => {
    const id = this.funcionalidadeSelId();
    if (!id) return [];
    return this.permissoes().filter(p => p.funcionalidadeId === id);
  });

  protected readonly dominioSel = computed<Dominio | undefined>(() =>
    this.dominios().find(d => d.id === this.dominioSelId()),
  );

  protected readonly funcionalidadeSel = computed<Funcionalidade | undefined>(() =>
    this.funcionalidades().find(f => f.id === this.funcionalidadeSelId()),
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    forkJoin({
      dominios: this.dominioService.listarTodos(),
      funcionalidades: this.funcionalidadeService.listar({ size: 500 }),
      permissoes: this.permissaoService.listarTodos(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ dominios, funcionalidades, permissoes }) => {
          this.dominios.set(dominios);
          this.funcionalidades.set(funcionalidades.items);
          this.permissoes.set(permissoes);
          if (!this.dominioSelId() && dominios.length > 0) {
            this.selecionarDominio(dominios[0]);
          }
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar matriz de segurança.'),
      });
  }

  selecionarDominio(d: Dominio): void {
    this.dominioSelId.set(d.id);
    this.funcionalidadeSelId.set(null);
    this.fecharForms();
    const primeira = this.funcionalidades().find(f => f.dominioId === d.id);
    if (primeira) this.funcionalidadeSelId.set(primeira.id);
  }

  selecionarFuncionalidade(f: Funcionalidade): void {
    this.funcionalidadeSelId.set(f.id);
    this.fecharForms();
  }

  // -------- Domínio ---------
  abrirFormDominio(d?: Dominio): void {
    this.fecharForms();
    this.editDominio.set(d ?? null);
    this.formDominio.reset(
      d
        ? { nome: d.nome, codigo: d.codigo, descricao: d.descricao ?? '', ativo: d.ativo }
        : { nome: '', codigo: '', descricao: '', ativo: true },
    );
    this.mostraFormDominio.set(true);
  }

  salvarDominio(): void {
    if (this.formDominio.invalid || this.saving()) {
      this.formDominio.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.formDominio.getRawValue();
    const payload = {
      nome: raw.nome.trim(),
      codigo: raw.codigo.trim(),
      descricao: raw.descricao.trim() || undefined,
      ativo: raw.ativo,
    };
    const ed = this.editDominio();
    const obs = ed ? this.dominioService.atualizar(ed.id, payload) : this.dominioService.criar(payload);
    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: d => {
        this.dominios.update(list => (ed ? list.map(x => (x.id === d.id ? d : x)) : [d, ...list]));
        this.mostraFormDominio.set(false);
        this.editDominio.set(null);
        if (!ed) this.selecionarDominio(d);
        this.toast.success(ed ? 'Domínio atualizado.' : 'Domínio cadastrado.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao salvar domínio.'),
    });
  }

  toggleStatusDominio(d: Dominio): void {
    this.dominioService.alterarStatus(d.id, !d.ativo).subscribe({
      next: atu => {
        this.dominios.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success(atu.ativo ? 'Domínio ativado.' : 'Domínio inativado.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao alterar status.'),
    });
  }

  // -------- Funcionalidade ---------
  abrirFormFunc(f?: Funcionalidade): void {
    if (!this.dominioSelId()) return;
    this.fecharForms();
    this.editFunc.set(f ?? null);
    this.formFunc.reset(
      f
        ? { nome: f.nome, codigo: f.codigo, descricao: f.descricao ?? '', ativo: f.ativo }
        : { nome: '', codigo: '', descricao: '', ativo: true },
    );
    this.mostraFormFunc.set(true);
  }

  salvarFuncionalidade(): void {
    if (this.formFunc.invalid || this.saving() || !this.dominioSelId()) {
      this.formFunc.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.formFunc.getRawValue();
    const payload = {
      dominioId: this.dominioSelId()!,
      nome: raw.nome.trim(),
      codigo: raw.codigo.trim(),
      descricao: raw.descricao.trim() || undefined,
      ativo: raw.ativo,
    };
    const ed = this.editFunc();
    const obs = ed
      ? this.funcionalidadeService.atualizar(ed.id, payload)
      : this.funcionalidadeService.criar(payload);
    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: f => {
        this.funcionalidades.update(list => (ed ? list.map(x => (x.id === f.id ? f : x)) : [f, ...list]));
        this.mostraFormFunc.set(false);
        this.editFunc.set(null);
        if (!ed) this.selecionarFuncionalidade(f);
        this.toast.success(ed ? 'Funcionalidade atualizada.' : 'Funcionalidade cadastrada.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao salvar funcionalidade.'),
    });
  }

  toggleStatusFunc(f: Funcionalidade): void {
    this.funcionalidadeService.alterarStatus(f.id, !f.ativo).subscribe({
      next: atu => {
        this.funcionalidades.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success(atu.ativo ? 'Funcionalidade ativada.' : 'Funcionalidade inativada.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao alterar status.'),
    });
  }

  // -------- Permissão ---------
  abrirFormPerm(p?: Permissao): void {
    if (!this.funcionalidadeSelId()) return;
    this.fecharForms();
    this.editPerm.set(p ?? null);
    this.formPerm.reset(
      p
        ? { acao: p.acao, descricao: p.descricao ?? '', ativo: p.ativo }
        : { acao: '', descricao: '', ativo: true },
    );
    this.mostraFormPerm.set(true);
  }

  salvarPermissao(): void {
    const func = this.funcionalidadeSel();
    if (this.formPerm.invalid || this.saving() || !func) {
      this.formPerm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.formPerm.getRawValue();
    const acao = raw.acao.trim();
    const codigo = `${func.codigo}:${acao}`;
    const payload = {
      funcionalidadeId: func.id,
      acao,
      codigo,
      descricao: raw.descricao.trim() || undefined,
      ativo: raw.ativo,
    };
    const ed = this.editPerm();
    const obs = ed ? this.permissaoService.atualizar(ed.id, payload) : this.permissaoService.criar(payload);
    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: p => {
        this.permissoes.update(list => (ed ? list.map(x => (x.id === p.id ? p : x)) : [p, ...list]));
        this.mostraFormPerm.set(false);
        this.editPerm.set(null);
        this.toast.success(ed ? 'Permissão atualizada.' : 'Permissão cadastrada.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao salvar permissão.'),
    });
  }

  toggleStatusPerm(p: Permissao): void {
    this.permissaoService.alterarStatus(p.id, !p.ativo).subscribe({
      next: atu => {
        this.permissoes.update(list => list.map(x => (x.id === atu.id ? atu : x)));
        this.toast.success(atu.ativo ? 'Permissão ativada.' : 'Permissão inativada.');
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao alterar status.'),
    });
  }

  // -------- Geral ---------
  fecharForms(): void {
    this.mostraFormDominio.set(false);
    this.mostraFormFunc.set(false);
    this.mostraFormPerm.set(false);
    this.editDominio.set(null);
    this.editFunc.set(null);
    this.editPerm.set(null);
  }
}
