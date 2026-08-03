import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PoliticaSenhaService } from '@modules/identity-access/services/politica-senha.service';
import { ButtonComponent, CardComponent, PageHeaderComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-politica-senha',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, PageHeaderComponent, CardComponent, ButtonComponent],
  templateUrl: './politica-senha.component.html',
  styleUrl: './politica-senha.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-form-page' },
})
export class PoliticaSenhaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PoliticaSenhaService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    tamanhoMinimo: [4, [Validators.required, Validators.min(4), Validators.max(64)]],
    exigirMaiuscula: [false],
    exigirMinuscula: [false],
    exigirNumero: [false],
    exigirEspecial: [false],
    expiraSenhaDias: this.fb.nonNullable.control<number | null>(null),
    quantidadeHistorico: [3, [Validators.required, Validators.min(0), Validators.max(20)]],
    maxTentativasInvalidas: [5, [Validators.required, Validators.min(0), Validators.max(50)]],
  });

  /** Senha de teste para o usuário ver se a política passa antes de salvar. */
  protected senhaTeste = '';
  protected readonly violacoesTeste = signal<string[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.service
      .atual()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: p =>
          this.form.patchValue({
            tamanhoMinimo: p.tamanhoMinimo,
            exigirMaiuscula: p.exigirMaiuscula,
            exigirMinuscula: p.exigirMinuscula,
            exigirNumero: p.exigirNumero,
            exigirEspecial: p.exigirEspecial,
            expiraSenhaDias: p.expiraSenhaDias,
            quantidadeHistorico: p.quantidadeHistorico,
            maxTentativasInvalidas: p.maxTentativasInvalidas,
          }),
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar política.'),
      });
  }

  testar(event: Event): void {
    this.senhaTeste = (event.target as HTMLInputElement).value;
    const raw = this.form.getRawValue();
    const r = this.service.validar(this.senhaTeste, {
      id: 'preview',
      ativo: true,
      criadoEm: '',
      atualizadoEm: null,
      tamanhoMinimo: raw.tamanhoMinimo,
      exigirMaiuscula: raw.exigirMaiuscula,
      exigirMinuscula: raw.exigirMinuscula,
      exigirNumero: raw.exigirNumero,
      exigirEspecial: raw.exigirEspecial,
      expiraSenhaDias: raw.expiraSenhaDias,
      quantidadeHistorico: raw.quantidadeHistorico,
      maxTentativasInvalidas: raw.maxTentativasInvalidas,
    });
    this.violacoesTeste.set(r.violacoes);
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .atualizar({
        tamanhoMinimo: raw.tamanhoMinimo,
        exigirMaiuscula: raw.exigirMaiuscula,
        exigirMinuscula: raw.exigirMinuscula,
        exigirNumero: raw.exigirNumero,
        exigirEspecial: raw.exigirEspecial,
        expiraSenhaDias: raw.expiraSenhaDias,
        quantidadeHistorico: raw.quantidadeHistorico,
        maxTentativasInvalidas: raw.maxTentativasInvalidas,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.toast.success('Política de senha atualizada.'),
        error: e => this.toast.error(e?.message ?? 'Erro ao salvar política.'),
      });
  }
}
