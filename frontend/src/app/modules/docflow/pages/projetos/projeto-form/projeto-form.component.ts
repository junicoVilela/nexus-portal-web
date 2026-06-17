import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Projeto } from '@modules/docflow/models/projeto.model';
import { PageHeaderComponent, ButtonComponent, CardComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-projeto-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, ButtonComponent, CardComponent],
  templateUrl: './projeto-form.component.html',
  styleUrl: './projeto-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjetoFormComponent implements OnInit {
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly projetoAtual = signal<Projeto | undefined>(undefined);
  protected readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    slug: [''],
    descricao: [''],
    ativo: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly projetoService: ProjetoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.editId.set(id);
    if (!id) return;
    this.projetoService.projeto(id).subscribe({
      next: projeto => {
        this.projetoAtual.set(projeto);
        this.form.patchValue({
          nome: projeto.nome,
          slug: projeto.slug,
          descricao: projeto.descricao ?? '',
          ativo: projeto.ativo,
        });
      },
      error: () => this.toast.error('Erro ao carregar projeto.'),
    });
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.projetoService.salvarProjeto(this.form.getRawValue(), this.editId()).subscribe({
      next: () => this.voltar(),
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao salvar projeto.');
      },
    });
  }

  voltar(): void {
    this.router.navigate(docFlowRouterCommands(['projetos']));
  }
}
