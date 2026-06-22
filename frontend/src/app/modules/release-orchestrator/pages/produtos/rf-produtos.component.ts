import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { Produto, TestarGithubResult } from '../../models/produto.model';
import { ProdutoService } from '../../services/produto.service';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  PageHeaderComponent,
  ButtonComponent,
  BadgeComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ErrorVariant,
  SkeletonComponent,
} from '@shared/ui';
import { carregarFiltros, salvarFiltros } from '@shared/utils/persisted-filters';
import { classificarErro } from '@shared/utils/error-classifier';

const PRESET_CORES = [
  '#2563eb',
  '#0891b2',
  '#7c3aed',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#0f766e',
  '#be185d',
  '#9333ea',
  '#ea580c',
];

@Component({
  selector: 'app-rf-produtos',
  standalone: true,
  imports: [
    DatePipe,
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
  templateUrl: './rf-produtos.component.html',
  styleUrl: './rf-produtos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfProdutosComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly produtos = signal<Produto[]>([]);
  protected filtroNome = '';

  protected readonly showForm = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly excluindoId = signal<string | null>(null);
  protected form!: FormGroup;
  protected readonly presetCores = PRESET_CORES;

  protected readonly produtosFiltrados = computed<Produto[]>(() => {
    const q = this.filtroNome.toLowerCase();
    const lista = this.produtos();
    if (!q) return lista;
    return lista.filter(p => p.nome.toLowerCase().includes(q) || p.sigla.toLowerCase().includes(q));
  });

  constructor(
    private readonly produtoService: ProdutoService,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.filtroNome = carregarFiltros<{ nome: string }>('release-orchestrator:produtos')?.nome ?? '';
    this.buildForm();
    this.carregar();
  }

  protected salvarFiltro(): void {
    salvarFiltros('release-orchestrator:produtos', { nome: this.filtroNome });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      sigla: ['', [Validators.required, Validators.maxLength(20)]],
      descricao: [''],
      cor: ['#2563eb', Validators.required],
      responsavelId: [''],
      ativo: [true],
      repositorioGithub: ['', Validators.maxLength(200)],
      branchPadrao: ['main', Validators.maxLength(80)],
      padraoTag: ['^v\\d+\\.\\d+\\.\\d+$', Validators.maxLength(200)],
      /** Vazio em edição preserva o token atual. */
      githubToken: ['', Validators.maxLength(500)],
    });
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this.produtoService.listar().subscribe({
      next: r => {
        this.produtos.set(r.items);
        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar a lista de produtos.');
        this.produtos.set([]);
        this.loading.set(false);
      },
    });
  }

  protected abrirNovo(): void {
    this.editId.set(null);
    this.form.reset({
      cor: '#2563eb',
      ativo: true,
      branchPadrao: 'main',
      padraoTag: '^v\\d+\\.\\d+\\.\\d+$',
    });
    this.resultadoTeste.set(null);
    this.showForm.set(true);
  }

  protected editar(p: Produto): void {
    this.editId.set(p.id);
    this.form.patchValue({
      ...p,
      githubToken: '',
    });
    this.resultadoTeste.set(null);
    this.showForm.set(true);
  }

  protected readonly testandoGithub = signal(false);
  protected readonly resultadoTeste = signal<TestarGithubResult | null>(null);

  protected testarGithub(): void {
    const id = this.editId();
    if (!id) {
      this.resultadoTeste.set({
        sucesso: false,
        erro: 'Salve o produto antes de testar a integração GitHub.',
      });
      return;
    }
    this.testandoGithub.set(true);
    this.resultadoTeste.set(null);
    const f = this.form.value;
    this.produtoService
      .testarGithub(id, {
        repositorioGithub: f.repositorioGithub || undefined,
        githubToken: f.githubToken || undefined,
      })
      .subscribe({
        next: r => {
          this.resultadoTeste.set(r);
          this.testandoGithub.set(false);
        },
        error: () => {
          this.resultadoTeste.set({
            sucesso: false,
            erro: 'Falha ao chamar o servidor.',
          });
          this.testandoGithub.set(false);
        },
      });
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
    const data = { ...this.form.value };
    // PUT com token vazio = preservar token atual no backend
    if (!data.githubToken) delete data.githubToken;
    if (!data.repositorioGithub) {
      delete data.repositorioGithub;
      delete data.branchPadrao;
      delete data.padraoTag;
      delete data.githubToken;
    }
    const id = this.editId();
    const op = id ? this.produtoService.atualizar(id, data) : this.produtoService.criar(data);
    op.subscribe({
      next: p => {
        if (id) {
          this.produtos.update(list => list.map(x => (x.id === id ? p : x)));
        } else {
          this.produtos.update(list => [p, ...list]);
        }
        this.showForm.set(false);
        this.salvando.set(false);
      },
      error: () => this.salvando.set(false),
    });
  }

  protected excluir(p: Produto): void {
    this.produtoService.excluir(p.id).subscribe({
      next: () => {
        this.produtos.update(list => list.filter(x => x.id !== p.id));
        this.excluindoId.set(null);
      },
      error: () => {
        this.excluindoId.set(null);
        this.erro.set('Não foi possível excluir o produto. Remova as releases vinculadas antes.');
      },
    });
  }

  protected toggleAtivo(p: Produto): void {
    this.produtoService.alterarStatus(p.id, !p.ativo).subscribe({
      next: upd => this.produtos.update(list => list.map(x => (x.id === upd.id ? upd : x))),
      error: () => {
        /* rollback handled by re-fetch on retry */
      },
    });
  }

  protected escolherCor(cor: string): void {
    this.form.patchValue({ cor });
  }

  protected get corSelecionada(): string {
    return this.form.get('cor')?.value ?? '#2563eb';
  }

  protected fieldError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
