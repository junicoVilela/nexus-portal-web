import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { TIMINGS } from '@core/config/timings';
import { idadeEmDias } from '@shared/utils/dates';

import { Produto } from '../../../models/produto.model';
import { RELEASE_TIPO_LABELS, TipoRelease } from '../../../models/release.model';
import { ProdutoService } from '../../../services/produto.service';
import { ReleaseService } from '../../../services/release.service';
import { PageHeaderComponent, CardComponent, ButtonComponent } from '@shared/ui';
import { CanDeactivateComponent } from '@shared/guards';

@Component({
  selector: 'app-release-form',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent, CardComponent, ButtonComponent],
  templateUrl: './release-form.component.html',
  styleUrl: './release-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseFormComponent implements OnInit, OnDestroy, CanDeactivateComponent {
  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly produtos = signal<Produto[]>([]);
  protected readonly rascunhoSalvoEm = signal<Date | null>(null);
  protected form!: FormGroup;

  private readonly destroy$ = new Subject<void>();
  private dirty = false;
  private justSaved = false;

  protected readonly tipoLabels = RELEASE_TIPO_LABELS;
  protected readonly tipos = Object.keys(RELEASE_TIPO_LABELS) as TipoRelease[];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly produtoService: ProdutoService,
    private readonly releaseService: ReleaseService,
  ) {}

  private get draftKey(): string {
    return `release-orchestrator:release-form:${this.editId() ?? 'novo'}`;
  }

  ngOnInit(): void {
    this.buildForm();
    this.carregarProdutos();
    this.editId.set(this.route.snapshot.paramMap.get('id'));
    const id = this.editId();
    if (id) {
      this.carregarRelease(id);
    } else {
      this.restaurarRascunho();
      this.inicializarAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasUnsavedChanges(): boolean {
    return this.dirty && !this.justSaved;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      produtoId: ['', Validators.required],
      versao: ['', [Validators.required, Validators.maxLength(20)]],
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      tipo: ['MINOR', Validators.required],
      status: [{ value: 'RASCUNHO', disabled: true }],
      dataPrevista: [''],
      responsavelId: [''],
      resumo: [''],
      observacoes: [''],
    });
  }

  private carregarProdutos(): void {
    this.produtoService.listarTodos().subscribe({
      next: p => this.produtos.set(p),
      error: () => undefined /* feedback via errorInterceptor */,
    });
  }

  private carregarRelease(id: string): void {
    this.loading.set(true);
    this.releaseService.buscarPorId(id).subscribe({
      next: rel => {
        this.form.patchValue(rel);
        this.loading.set(false);
        this.restaurarRascunho();
        this.inicializarAutoSave();
      },
      error: () => this.loading.set(false),
    });
  }

  private inicializarAutoSave(): void {
    this.form.valueChanges
      .pipe(debounceTime(TIMINGS.autosaveDebounceMs), takeUntil(this.destroy$))
      .subscribe(value => {
        this.dirty = true;
        try {
          localStorage.setItem(this.draftKey, JSON.stringify({ value, at: Date.now() }));
          this.rascunhoSalvoEm.set(new Date());
        } catch {
          /* storage full / disabled */
        }
      });
  }

  private restaurarRascunho(): void {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return;
      const { value, at } = JSON.parse(raw) as { value: unknown; at: number };
      if (!value || typeof value !== 'object') return;
      const ageDays = idadeEmDias(at);
      if (ageDays > TIMINGS.draftMaxAgeDays) {
        localStorage.removeItem(this.draftKey);
        return;
      }
      this.form.patchValue(value as Record<string, unknown>);
      this.rascunhoSalvoEm.set(new Date(at));
    } catch {
      localStorage.removeItem(this.draftKey);
    }
  }

  private limparRascunho(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {
      /* noop */
    }
    this.dirty = false;
    this.rascunhoSalvoEm.set(null);
  }

  protected get titulo(): string {
    return this.editId() ? 'Editar release' : 'Nova release';
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const data = this.form.getRawValue();
    const id = this.editId();
    const op = id ? this.releaseService.atualizar(id, data) : this.releaseService.criar(data);
    op.subscribe({
      next: rel => {
        this.justSaved = true;
        this.limparRascunho();
        this.router.navigate(['/release-orchestrator/releases', rel.id]);
      },
      error: () => this.salvando.set(false),
    });
  }

  protected cancelar(): void {
    const id = this.editId();
    if (id) {
      this.router.navigate(['/release-orchestrator/releases', id]);
    } else {
      this.router.navigate(['/release-orchestrator/releases']);
    }
  }

  protected fieldError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
