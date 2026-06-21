import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin } from 'rxjs';

import { CanDeactivateComponent } from '@shared/guards';
import {
  ButtonComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/ui';

import {
  AMBIENTE_LABELS,
  AmbientePadrao,
  Cliente,
} from '../../models/cliente.model';
import { Produto } from '../../models/produto.model';
import { Release } from '../../models/release.model';
import {
  PRIORIDADE_LABELS,
  PrioridadeEntrega,
  ProximaEntregaForm,
} from '../../models/proxima-entrega.model';
import { ClienteService } from '../../services/cliente.service';
import { ProdutoService } from '../../services/produto.service';
import { ReleaseService } from '../../services/release.service';
import { ProximaEntregaService } from '../../services/proxima-entrega.service';

@Component({
  selector: 'app-proxima-entrega-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: './proxima-entrega-form.component.html',
  styleUrl: './proxima-entrega-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProximaEntregaFormComponent implements OnInit, CanDeactivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly clienteService = inject(ClienteService);
  private readonly produtoService = inject(ProdutoService);
  private readonly releaseService = inject(ReleaseService);
  private readonly service = inject(ProximaEntregaService);

  protected readonly editId = signal<string | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly produtos = signal<Produto[]>([]);
  protected readonly releases = signal<Release[]>([]);
  protected readonly editando = computed(() => this.editId() !== null);

  protected readonly ambientes = Object.keys(AMBIENTE_LABELS) as AmbientePadrao[];
  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly prioridades = Object.keys(PRIORIDADE_LABELS) as PrioridadeEntrega[];
  protected readonly prioridadeLabels = PRIORIDADE_LABELS;

  protected form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
    this.carregarReferencias();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.carregar(id);
    }

    this.form.get('produtoId')?.valueChanges.subscribe(produtoId => {
      this.releases.set([]);
      this.form.get('releaseId')?.setValue(null, { emitEvent: false });
      if (produtoId) this.carregarReleases(produtoId);
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty === true && !this.salvando();
  }

  unsavedChangesDescription(): string {
    return 'cadastro da próxima entrega';
  }

  private buildForm(): void {
    this.form = this.fb.group({
      clienteId: ['', Validators.required],
      produtoId: ['', Validators.required],
      releaseId: [null as string | null],
      dataPrevista: ['', Validators.required],
      ambiente: ['PROD' as AmbientePadrao, Validators.required],
      prioridade: ['MEDIA' as PrioridadeEntrega, Validators.required],
      responsavelId: [null as string | null],
      observacoes: ['', [Validators.maxLength(2000)]],
    });
  }

  private carregarReferencias(): void {
    forkJoin({
      clientes: this.clienteService.listar(1, 100, undefined, true),
      produtos: this.produtoService.listar(1, 100),
    }).subscribe({
      next: ({ clientes, produtos }) => {
        this.clientes.set(clientes.items);
        this.produtos.set(produtos.items);
      },
      error: () => this.toast.error('Não foi possível carregar clientes/produtos.'),
    });
  }

  private carregarReleases(produtoId: string): void {
    this.releaseService.listar({ produtoId, page: 1, size: 50 }).subscribe({
      next: r => this.releases.set(r.items),
      error: () => this.releases.set([]),
    });
  }

  private carregar(id: string): void {
    this.carregando.set(true);
    this.service.buscar(id).subscribe({
      next: pe => {
        this.form.patchValue({
          clienteId: pe.clienteId,
          produtoId: pe.produtoId,
          releaseId: pe.releaseId ?? null,
          dataPrevista: pe.dataPrevista,
          ambiente: pe.ambiente,
          prioridade: pe.prioridade,
          responsavelId: pe.responsavelId ?? null,
          observacoes: pe.observacoes ?? '',
        });
        if (pe.produtoId) this.carregarReleases(pe.produtoId);
        this.form.markAsPristine();
        this.carregando.set(false);
      },
      error: () => {
        this.toast.error('Não foi possível carregar a entrega.');
        this.carregando.set(false);
        this.router.navigate(['/release-orchestrator/proximas-entregas']);
      },
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Corrija os campos destacados antes de salvar.');
      return;
    }
    this.salvando.set(true);
    const raw = this.form.getRawValue();
    const payload: ProximaEntregaForm = {
      clienteId: raw.clienteId,
      produtoId: raw.produtoId,
      releaseId: raw.releaseId || undefined,
      dataPrevista: raw.dataPrevista,
      ambiente: raw.ambiente,
      prioridade: raw.prioridade,
      responsavelId: raw.responsavelId || undefined,
      observacoes: raw.observacoes || undefined,
    };
    const id = this.editId();
    const op$ = id ? this.service.atualizar(id, payload) : this.service.criar(payload);
    op$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.success(id ? 'Entrega atualizada.' : 'Entrega planejada.');
        this.form.markAsPristine();
        this.router.navigate(['/release-orchestrator/proximas-entregas']);
      },
      error: () => {
        this.salvando.set(false);
        this.toast.error('Erro ao salvar. Confira cliente, produto e release.');
      },
    });
  }

  protected fieldError(path: string): boolean {
    const c = this.form.get(path);
    return !!(c?.invalid && c?.touched);
  }
}
