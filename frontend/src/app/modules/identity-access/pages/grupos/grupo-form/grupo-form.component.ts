import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { GrupoAcesso } from '@modules/identity-access/models/grupo-acesso.model';
import { GrupoService } from '@modules/identity-access/services/grupo.service';
import { ButtonComponent, CardComponent, PageHeaderComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-grupo-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, PageHeaderComponent, ButtonComponent, CardComponent],
  templateUrl: './grupo-form.component.html',
  styleUrl: './grupo-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-form-page' },
})
export class GrupoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly grupoService = inject(GrupoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly grupoAtual = signal<GrupoAcesso | undefined>(undefined);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
    descricao: [''],
    ativo: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.editId.set(id);
    if (!id) return;
    this.loading.set(true);
    this.grupoService
      .buscarPorId(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: g => {
          this.grupoAtual.set(g);
          this.form.patchValue({
            nome: g.nome,
            codigo: g.codigo,
            descricao: g.descricao ?? '',
            ativo: g.ativo,
          });
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar grupo.'),
      });
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const id = this.editId();
    this.saving.set(true);
    const payload = {
      nome: raw.nome.trim(),
      codigo: raw.codigo.trim(),
      descricao: raw.descricao.trim() || undefined,
      ativo: raw.ativo,
    };
    const obs = id ? this.grupoService.atualizar(id, payload) : this.grupoService.criar(payload);
    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success(id ? 'Grupo atualizado.' : 'Grupo cadastrado.');
        this.voltar();
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao salvar grupo.'),
    });
  }

  voltar(): void {
    this.router.navigate(['/seguranca/grupos']);
  }
}
