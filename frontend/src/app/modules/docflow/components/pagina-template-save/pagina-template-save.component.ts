import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../../models/cliente.model';
import { Projeto } from '../../models/projeto.model';
import { PaginaTemplate } from '../../models/pagina.model';

export type EscopoPaginaTemplate = 'PROJETO' | 'CLIENTE';

export interface PaginaTemplateSalvarDados {
  nome: string;
  descricao?: string;
  projetoId?: string;
  clienteId?: string;
  substituirConteudo?: boolean;
}

@Component({
  selector: 'app-pagina-template-save',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pagina-template-save.component.html',
  styleUrl: './pagina-template-save.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaTemplateSaveComponent {
  private readonly fb = inject(FormBuilder);

  readonly projetos = input.required<Projeto[]>();
  readonly clientes = input.required<Cliente[]>();
  readonly projetoIdInicial = input('');
  readonly saving = input(false);
  readonly template = input<PaginaTemplate | null>(null);
  readonly confirmado = output<PaginaTemplateSalvarDados>();
  readonly cancelado = output<void>();

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    descricao: ['', Validators.maxLength(300)],
    escopo: ['PROJETO' as EscopoPaginaTemplate, Validators.required],
    projetoId: [''],
    clienteId: [''],
    substituirConteudo: [false],
  });

  constructor() {
    effect(() => {
      const projetoId = this.projetoIdInicial();
      if (projetoId && !this.form.controls.projetoId.value) {
        this.form.controls.projetoId.setValue(projetoId, { emitEvent: false });
      }
    });
    effect(() => {
      const template = this.template();
      if (!template) return;
      this.form.patchValue(
        {
          nome: template.nome,
          descricao: template.descricao ?? '',
          escopo: template.projetoId ? 'PROJETO' : 'CLIENTE',
          projetoId: template.projetoId ?? '',
          clienteId: template.clienteId ?? '',
          substituirConteudo: false,
        },
        { emitEvent: false },
      );
    });
  }

  definirEscopo(escopo: EscopoPaginaTemplate): void {
    this.form.controls.escopo.setValue(escopo);
    if (escopo === 'PROJETO') {
      this.form.controls.clienteId.setValue('');
      if (!this.form.controls.projetoId.value) {
        this.form.controls.projetoId.setValue(this.projetoIdInicial());
      }
    } else {
      this.form.controls.projetoId.setValue('');
    }
  }

  salvar(): void {
    const raw = this.form.getRawValue();
    const escopoId = raw.escopo === 'PROJETO' ? raw.projetoId : raw.clienteId;
    if (this.form.invalid || !escopoId || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const dados: PaginaTemplateSalvarDados = {
      nome: raw.nome.trim(),
      descricao: raw.descricao.trim() || undefined,
      projetoId: raw.escopo === 'PROJETO' ? raw.projetoId : undefined,
      clienteId: raw.escopo === 'CLIENTE' ? raw.clienteId : undefined,
    };
    if (this.template()) dados.substituirConteudo = raw.substituirConteudo;
    this.confirmado.emit(dados);
  }
}
