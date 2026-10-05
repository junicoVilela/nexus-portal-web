import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { finalize } from 'rxjs';

import { ButtonComponent, ConfirmService, ToastService } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { ManualSinonimo } from '../../models/manual-sinonimo.model';
import { ManualSinonimoService } from '../../services/manual-sinonimo.service';

/** "nota fiscal, NF; NF-e" → ["nota fiscal", "NF", "NF-e"]. */
export function termosDoTexto(texto: string): string[] {
  return texto
    .split(/[,;\n]/)
    .map(t => t.trim())
    .filter(Boolean);
}

/**
 * Sinônimos da busca do manual de um cliente: "NF" acha "nota fiscal". Valem na hora para
 * perguntas, MCP e manual hospedado; o ZIP baixado leva os da publicação.
 */
@Component({
  selector: 'app-manual-sinonimos',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './manual-sinonimos.component.html',
  styleUrl: './manual-sinonimos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSinonimosComponent {
  private readonly service = inject(ManualSinonimoService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly clienteId = input.required<string>();
  readonly podeEditar = input(false);
  /** Termo vindo de uma lacuna do dashboard: abre o formulário já começado. */
  readonly termoInicial = input<string | null>(null);

  protected readonly grupos = signal<ManualSinonimo[]>([]);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly novo = signal('');
  protected readonly editandoId = signal<string | null>(null);
  protected readonly edicao = signal('');

  constructor() {
    effect(() => {
      const clienteId = this.clienteId();
      untracked(() => this.carregar(clienteId));
    });
    effect(() => {
      const termo = this.termoInicial()?.trim();
      if (termo) untracked(() => this.novo.set(`${termo}, `));
    });
  }

  protected adicionar(): void {
    const termos = termosDoTexto(this.novo());
    if (termos.length < 2 || this.salvando()) return;
    this.salvando.set(true);
    this.service
      .criar(this.clienteId(), { termos })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: grupo => {
          this.grupos.update(lista => [...lista, grupo]);
          this.novo.set('');
          this.toast.success('Sinônimos salvos. Já valem para perguntas e para o manual hospedado.');
        },
        error: err => this.toast.error(mensagemErroHttp(err, 'Não foi possível salvar os sinônimos.')),
      });
  }

  protected editar(grupo: ManualSinonimo): void {
    this.editandoId.set(grupo.id);
    this.edicao.set(grupo.termos.join(', '));
  }

  protected salvarEdicao(grupo: ManualSinonimo): void {
    const termos = termosDoTexto(this.edicao());
    if (termos.length < 2 || this.salvando()) return;
    this.salvando.set(true);
    this.service
      .atualizar(grupo.id, { termos })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: atualizado => {
          this.grupos.update(lista => lista.map(g => (g.id === atualizado.id ? atualizado : g)));
          this.editandoId.set(null);
        },
        error: err => this.toast.error(mensagemErroHttp(err, 'Não foi possível salvar os sinônimos.')),
      });
  }

  protected async excluir(grupo: ManualSinonimo): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Excluir sinônimos?',
      message: `A busca deixa de tratar ${grupo.termos.join(', ')} como a mesma coisa.`,
      acceptLabel: 'Excluir',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!ok) return;
    this.service.excluir(grupo.id).subscribe({
      next: () => this.grupos.update(lista => lista.filter(g => g.id !== grupo.id)),
      error: err => this.toast.error(mensagemErroHttp(err, 'Não foi possível excluir os sinônimos.')),
    });
  }

  protected termosValidos(texto: string): boolean {
    return termosDoTexto(texto).length >= 2;
  }

  private carregar(clienteId: string): void {
    this.editandoId.set(null);
    if (!clienteId) {
      this.grupos.set([]);
      return;
    }
    this.carregando.set(true);
    this.service
      .listar(clienteId)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: grupos => this.grupos.set(grupos),
        error: err => this.toast.error(mensagemErroHttp(err, 'Erro ao carregar os sinônimos.')),
      });
  }
}
