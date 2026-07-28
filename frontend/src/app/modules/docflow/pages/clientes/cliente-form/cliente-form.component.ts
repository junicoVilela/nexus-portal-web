import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ClienteService } from '@modules/docflow/services/cliente.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Cliente } from '@modules/docflow/models/cliente.model';
import {
  PageHeaderComponent,
  ButtonComponent,
  CardComponent,
  ConfirmService,
  ToastService,
} from '@shared/ui';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, PageHeaderComponent, ButtonComponent, CardComponent],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteFormComponent implements OnInit {
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly clienteAtual = signal<Cliente | undefined>(undefined);
  protected readonly saving = signal(false);
  protected readonly logoPreviewUrl = signal('');
  protected readonly uploadingLogo = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    slug: [''],
    ativo: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly clienteService: ClienteService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.editId.set(id);
    if (!id) return;
    this.clienteService.cliente(id).subscribe({
      next: cliente => {
        this.clienteAtual.set(cliente);
        this.form.patchValue({
          nome: cliente.nome,
          slug: cliente.slug,
          ativo: cliente.ativo,
        });
        if (cliente.logoDisponivel) {
          this.logoPreviewUrl.set(this.clienteService.logoUrlCliente(id));
        }
      },
      error: err => this.toast.error(this.errorMessage(err, 'Erro ao carregar cliente.')),
    });
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    const nome = raw.nome.trim();
    if (!nome) {
      this.toast.error('Informe o nome do cliente.');
      return;
    }
    this.saving.set(true);
    this.clienteService
      .salvarCliente(
        {
          nome,
          slug: raw.slug.trim() || undefined,
          ativo: raw.ativo,
        },
        this.editId(),
      )
      .subscribe({
        next: () => this.voltar(),
        error: err => {
          this.saving.set(false);
          this.toast.error(this.errorMessage(err, 'Erro ao salvar cliente.'));
        },
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const id = this.editId();
    if (!file || !id) return;

    this.uploadingLogo.set(true);
    this.clienteService.uploadLogoCliente(id, file).subscribe({
      next: () => {
        this.logoPreviewUrl.set(this.clienteService.logoUrlCliente(id) + '?t=' + Date.now());
        this.uploadingLogo.set(false);
        this.toast.success('Logo atualizado com sucesso.');
      },
      error: err => {
        this.uploadingLogo.set(false);
        this.toast.error(this.errorMessage(err, 'Erro ao enviar logo.'));
      },
    });
    input.value = '';
  }

  async removerLogo(): Promise<void> {
    const id = this.editId();
    if (!id) return;
    const ok = await this.confirmService.confirm({
      title: 'Remover logo do cliente?',
      message: 'O logo atual será apagado. Você pode fazer upload de um novo a qualquer momento.',
      acceptLabel: 'Remover',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!ok) return;
    this.clienteService.removerLogoCliente(id).subscribe({
      next: () => {
        this.logoPreviewUrl.set('');
        this.toast.success('Logo removido.');
      },
      error: err => this.toast.error(this.errorMessage(err, 'Erro ao remover logo.')),
    });
  }

  voltar(): void {
    this.router.navigate(docFlowRouterCommands(['clientes']));
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) return fallback;
    if (typeof err.error?.message === 'string') return err.error.message;
    if (Array.isArray(err.error?.errors) && err.error.errors.length > 0) return err.error.errors.join(' ');
    return fallback;
  }
}
