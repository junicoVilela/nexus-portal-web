import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Produto } from '../../models/produto.model';
import { Release, RELEASE_TIPO_LABELS, TipoRelease } from '../../models/release.model';
import {
  CategoriaItem,
  CATEGORIA_LABELS,
  CATEGORIA_CORES,
  CATEGORIAS_ORDENADAS,
} from '../../models/release-item.model';
import { ProdutoService } from '../../services/produto.service';
import { ReleaseService } from '../../services/release.service';
import { ReleaseItemService } from '../../services/release-item.service';

import { LucideAngularModule } from 'lucide-angular';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PageHeaderComponent, ButtonComponent, BadgeComponent } from '@shared/ui';
import { RfBuilderTimelineComponent } from '../../components/rf-builder-timeline';

export interface EntradaLocal {
  id: string;
  categoria: CategoriaItem;
  titulo: string;
  descricao: string;
  ticket: string;
  commit: string;
  savedAt: Date;
  saving?: boolean;
  saved?: boolean;
  error?: boolean;
}

@Component({
  selector: 'app-release-builder',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    RfBuilderTimelineComponent,
  ],
  templateUrl: './release-builder.component.html',
  styleUrl: './release-builder.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseBuilderComponent implements OnInit {
  @ViewChild('entradaInput') entradaInput?: ElementRef<HTMLInputElement>;

  /* ── Estado da release cabeçalho ── */
  protected releaseForm!: FormGroup;
  protected readonly produtos = signal<Produto[]>([]);
  protected readonly release = signal<Release | null>(null);
  protected readonly criandoRelease = signal(false);
  protected readonly erroCriar = signal<string | null>(null);
  protected readonly releaseAberta = signal(false);

  /* ── Estado do builder de entradas ── */
  protected entradaForm!: FormGroup;
  protected readonly entradas = signal<EntradaLocal[]>([]);
  protected readonly encerrando = signal(false);
  protected readonly categoriaAtiva = signal<CategoriaItem>('NOVIDADE');

  /* ── Labels ── */
  protected readonly tipoLabels = RELEASE_TIPO_LABELS;
  protected readonly categoriaLabels = CATEGORIA_LABELS;
  protected readonly categoriaCores = CATEGORIA_CORES;
  protected readonly categorias = CATEGORIAS_ORDENADAS;
  protected readonly tipos = Object.keys(RELEASE_TIPO_LABELS) as TipoRelease[];

  protected readonly categoriaIconesLucide: Record<CategoriaItem, string> = {
    NOVIDADE: 'Star',
    MELHORIA: 'TrendingUp',
    CORRECAO: 'Wrench',
    SEGURANCA: 'Shield',
    PERFORMANCE: 'Zap',
    DOCUMENTACAO: 'FilePen',
    AJUSTE_TECNICO: 'Code',
    IMPACTO_OPERACIONAL: 'AlertTriangle',
    IMPORTANTE: 'Info',
  };

  protected readonly podeSalvar = computed(() => {
    const lista = this.entradas();
    return lista.length > 0 && lista.every(e => !e.saving);
  });

  protected onEntradaDrop(event: CdkDragDrop<EntradaLocal[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const original = this.entradas();
    this.entradas.update(list => {
      const copy = [...list];
      moveItemInArray(copy, event.previousIndex, event.currentIndex);
      return copy;
    });
    const rel = this.release();
    if (!rel) return;
    const ordens = this.entradas()
      .filter(e => !e.id.startsWith('local-'))
      .map((e, i) => ({ id: e.id, ordem: i }));
    if (ordens.length === 0) return;
    this.itemService.reordenar(rel.id, ordens).subscribe({
      error: () => this.entradas.set(original),
    });
  }

  protected readonly versaoDisplay = computed(() => {
    const rel = this.release();
    return rel ? `${rel.produtoSigla ?? ''} v${rel.versao}` : '';
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly produtoService: ProdutoService,
    private readonly releaseService: ReleaseService,
    private readonly itemService: ReleaseItemService,
  ) {}

  ngOnInit(): void {
    this.buildReleaseForm();
    this.buildEntradaForm();
    this.carregarProdutos();
  }

  private buildReleaseForm(): void {
    this.releaseForm = this.fb.group({
      produtoId: ['', Validators.required],
      versao: ['', [Validators.required, Validators.pattern(/^\d+\.\d+(\.\d+)?(-\w+)?$/)]],
      titulo: ['', Validators.required],
      tipo: ['MINOR', Validators.required],
      dataPrevista: [''],
      resumo: [''],
    });
  }

  private buildEntradaForm(): void {
    this.entradaForm = this.fb.group({
      titulo: ['', Validators.required],
      descricao: [''],
      ticket: [''],
      commit: [''],
    });
  }

  private carregarProdutos(): void {
    this.produtoService.listarTodos().subscribe({
      next: p => this.produtos.set(p),
      error: () => undefined /* feedback via errorInterceptor */,
    });
  }

  /* ─── Produto helper ── */
  protected get produtoSelecionado(): Produto | undefined {
    const id = this.releaseForm.get('produtoId')?.value;
    return this.produtos().find(p => p.id === id);
  }

  /* ─── Criar release (step 1) ── */
  protected iniciarRelease(): void {
    if (this.releaseForm.invalid) {
      this.releaseForm.markAllAsTouched();
      return;
    }
    this.criandoRelease.set(true);
    this.erroCriar.set(null);
    this.releaseService.criar({ ...this.releaseForm.value, status: 'EM_DESENVOLVIMENTO' }).subscribe({
      next: rel => {
        this.release.set(rel);
        this.releaseAberta.set(true);
        this.criandoRelease.set(false);
        setTimeout(() => this.focarEntrada(), 150);
      },
      error: () => {
        this.erroCriar.set('Não foi possível criar a release. Cadastre um produto e verifique a API.');
        this.criandoRelease.set(false);
      },
    });
  }

  /* ─── Adicionar entrada (step 2) ── */
  protected selecionarCategoria(cat: CategoriaItem): void {
    this.categoriaAtiva.set(cat);
    this.focarEntrada();
  }

  protected adicionarEntrada(): void {
    if (!this.entradaForm.get('titulo')?.value?.trim()) return;
    const local: EntradaLocal = {
      id: Date.now().toString(),
      categoria: this.categoriaAtiva(),
      titulo: this.entradaForm.value.titulo.trim(),
      descricao: this.entradaForm.value.descricao?.trim() ?? '',
      ticket: this.entradaForm.value.ticket?.trim() ?? '',
      commit: this.entradaForm.value.commit?.trim() ?? '',
      savedAt: new Date(),
      saving: true,
    };

    this.entradas.update(list => [local, ...list]);
    this.entradaForm.reset();
    this.focarEntrada();

    const rel = this.release();
    if (!rel?.id) {
      this.marcarEntradaSalva(local.id);
      return;
    }

    this.itemService
      .criar(rel.id, {
        categoria: local.categoria,
        titulo: local.titulo,
        descricao: local.descricao || undefined,
        visibilidade: 'TODOS',
        ticket: local.ticket || undefined,
        commit: local.commit || undefined,
      })
      .subscribe({
        next: () => this.marcarEntradaSalva(local.id),
        error: () => this.marcarEntradaSalva(local.id, true),
      });
  }

  private marcarEntradaSalva(id: string, comErro = false): void {
    this.entradas.update(list =>
      list.map(e => (e.id === id ? { ...e, saving: false, saved: true, error: comErro || e.error } : e)),
    );
  }

  protected removerEntrada(entrada: EntradaLocal): void {
    this.entradas.update(list => list.filter(e => e.id !== entrada.id));
  }

  /* ─── Encerrar release (step 3) ── */
  protected encerrar(): void {
    const rel = this.release();
    if (!rel) return;
    this.encerrando.set(true);
    this.releaseService.alterarStatus(rel.id, 'EM_REVISAO').subscribe({
      next: () => this.router.navigate(['/release-orchestrator/releases', rel.id]),
      error: () => this.router.navigate(['/release-orchestrator/releases']),
    });
  }

  /* ─── Helpers ── */
  private focarEntrada(): void {
    setTimeout(() => this.entradaInput?.nativeElement?.focus(), 80);
  }

  protected fieldError(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
