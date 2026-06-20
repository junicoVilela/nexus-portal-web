import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';

import {
  CriarModuloProdutoForm,
  ModuloProduto,
  TIPO_MODULO_DEFAULTS,
  TIPO_MODULO_EXTENSOES,
  TipoModulo,
} from '../../../models/modulo-produto.model';
import { Produto } from '../../../models/produto.model';
import { ModuloProdutoService } from '../../../services/modulo-produto.service';
import { ProdutoService } from '../../../services/produto.service';

const TIPOS: { valor: TipoModulo; rotulo: string; cor: string }[] = [
  { valor: 'WEB', rotulo: 'Web', cor: '#2563eb' },
  { valor: 'BATCH', rotulo: 'Batch', cor: '#0891b2' },
  { valor: 'BANCO', rotulo: 'Banco', cor: '#9333ea' },
  { valor: 'KETTLE', rotulo: 'Kettle', cor: '#16a34a' },
  { valor: 'FUNCIONALIDADES', rotulo: 'Funcionalidades', cor: '#d97706' },
  { valor: 'REGRAS', rotulo: 'Regras', cor: '#dc2626' },
];

const CODIGO_REGEX = /^[a-z0-9-]+$/;

@Component({
  selector: 'app-modulos-produto',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './modulos-produto.component.html',
  styleUrl: './modulos-produto.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulosProdutoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly moduloService = inject(ModuloProdutoService);
  private readonly produtoService = inject(ProdutoService);
  private readonly fb = inject(FormBuilder);

  protected readonly produtoId = signal<string>('');
  protected readonly produto = signal<Produto | null>(null);
  protected readonly modulos = signal<ModuloProduto[]>([]);

  protected readonly loading = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');

  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);

  protected readonly tipos = TIPOS;
  protected form!: FormGroup;

  protected readonly editando = computed(() => this.editId() !== null);

  protected readonly extensoesAceitas = computed(() => {
    const tipo = this.form?.get('tipo')?.value as TipoModulo | null;
    return tipo ? TIPO_MODULO_EXTENSOES[tipo] : [];
  });

  ngOnInit(): void {
    this.buildForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') ?? '';
      this.produtoId.set(id);
      if (id) {
        this.carregar(id);
      }
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(200)]],
      codigo: ['', [Validators.required, Validators.maxLength(80), Validators.pattern(CODIGO_REGEX)]],
      tipo: ['WEB' as TipoModulo, Validators.required],
      geraDelta: [false],
      obrigatorio: [true],
      ordem: [0],
      configEspecifica: [''],
    });

    this.form.get('tipo')!.valueChanges.subscribe((tipo: TipoModulo | null) => {
      if (!tipo || this.editando()) return;
      const defaults = TIPO_MODULO_DEFAULTS[tipo];
      this.form.patchValue({
        geraDelta: defaults.geraDelta,
        obrigatorio: defaults.obrigatorio,
      }, { emitEvent: false });
    });
  }

  protected carregar(produtoId: string): void {
    this.loading.set(true);
    this.erro.set(null);
    forkJoin({
      produto: this.produtoService.buscarPorId(produtoId),
      modulos: this.moduloService.listar(produtoId),
    }).subscribe({
      next: ({ produto, modulos }) => {
        this.produto.set(produto);
        this.modulos.set(modulos);
        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar os módulos do produto.');
        this.loading.set(false);
      },
    });
  }

  protected abrirNovo(): void {
    this.editId.set(null);
    this.form.reset({
      nome: '',
      codigo: '',
      tipo: 'WEB',
      geraDelta: false,
      obrigatorio: true,
      ordem: 0,
      configEspecifica: '',
    });
    this.form.get('codigo')!.enable();
    this.form.get('tipo')!.enable();
    this.showForm.set(true);
  }

  protected editar(m: ModuloProduto): void {
    this.editId.set(m.id);
    this.form.patchValue({
      nome: m.nome,
      codigo: m.codigo,
      tipo: m.tipo,
      geraDelta: m.geraDelta,
      obrigatorio: m.obrigatorio,
      ordem: m.ordem,
      configEspecifica: m.configEspecifica ?? '',
    });
    this.form.get('codigo')!.disable();
    this.form.get('tipo')!.disable();
    this.showForm.set(true);
  }

  protected fecharForm(): void {
    this.showForm.set(false);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const raw = this.form.getRawValue();
    const id = this.editId();
    const op = id
      ? this.moduloService.atualizar(this.produtoId(), id, {
          nome: raw.nome,
          geraDelta: raw.geraDelta,
          obrigatorio: raw.obrigatorio,
          configEspecifica: raw.configEspecifica || undefined,
        })
      : this.moduloService.criar(this.produtoId(), {
          nome: raw.nome,
          codigo: raw.codigo,
          tipo: raw.tipo,
          geraDelta: raw.geraDelta,
          obrigatorio: raw.obrigatorio,
          ordem: raw.ordem,
          configEspecifica: raw.configEspecifica || undefined,
        } as CriarModuloProdutoForm);

    op.subscribe({
      next: modulo => {
        if (id) {
          this.modulos.update(list => list.map(x => (x.id === id ? modulo : x)));
        } else {
          this.modulos.update(list => [...list, modulo].sort(this.ordenar));
        }
        this.salvando.set(false);
        this.showForm.set(false);
      },
      error: () => this.salvando.set(false),
    });
  }

  protected toggleAtivo(m: ModuloProduto): void {
    this.moduloService.alterarStatus(this.produtoId(), m.id, !m.ativo).subscribe({
      next: upd => this.modulos.update(list => list.map(x => (x.id === upd.id ? upd : x))),
      error: () => undefined,
    });
  }

  protected excluir(m: ModuloProduto): void {
    this.moduloService.excluir(this.produtoId(), m.id).subscribe({
      next: () => this.modulos.update(list => list.filter(x => x.id !== m.id)),
      error: () => {
        this.erro.set('Não foi possível excluir o módulo. Inative se já tiver artefatos.');
      },
    });
  }

  protected rotuloTipo(tipo: TipoModulo): string {
    return TIPOS.find(t => t.valor === tipo)?.rotulo ?? tipo;
  }

  protected corTipo(tipo: TipoModulo): string {
    return TIPOS.find(t => t.valor === tipo)?.cor ?? '#666';
  }

  protected fieldError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  private ordenar(a: ModuloProduto, b: ModuloProduto): number {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.nome.localeCompare(b.nome);
  }
}
