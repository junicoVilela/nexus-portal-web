import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Modulo } from '@modules/docflow/models/modulo.model';
import { Projeto } from '@modules/docflow/models/projeto.model';
import { PageHeaderComponent, ButtonComponent, CardComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-modulo-form',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, ButtonComponent, CardComponent],
  templateUrl: './modulo-form.component.html',
  styleUrl: './modulo-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuloFormComponent implements OnInit {
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly moduloAtual = signal<Modulo | undefined>(undefined);
  protected readonly projetos = signal<Projeto[]>([]);
  protected readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    slug: [''],
    descricao: [''],
    ordem: [0],
    ativo: [true],
    projetoId: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly moduloService: ModuloService,
    private readonly projetoService: ProjetoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.editId.set(id);
    if (id) {
      forkJoin({
        projetos: this.projetoService.projetos(),
        modulo: this.moduloService.modulo(id),
      }).subscribe({
        next: ({ projetos, modulo }) => {
          this.projetos.set(projetos);
          this.moduloAtual.set(modulo);
          this.form.patchValue({
            nome: modulo.nome,
            slug: modulo.slug,
            descricao: modulo.descricao ?? '',
            ordem: modulo.ordem,
            ativo: modulo.ativo,
            projetoId: modulo.projetoId,
          });
        },
        error: () => this.toast.error('Erro ao carregar dados do módulo.'),
      });
      return;
    }
    this.projetoService.projetos().subscribe({
      next: projetos => this.projetos.set(projetos),
      error: () => this.toast.error('Erro ao carregar projetos.'),
    });
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.moduloService.salvarModulo(this.form.getRawValue(), this.editId()).subscribe({
      next: () => this.voltar(),
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao salvar módulo.');
      },
    });
  }

  voltar(): void {
    this.router.navigate(docFlowRouterCommands(['modulos']));
  }
}
