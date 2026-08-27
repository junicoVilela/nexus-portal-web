import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PaginaSnippet, PaginaSnippetCriacao } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ListPageComponent } from '@shared/layouts';
import { BadgeComponent, ButtonComponent, ConfirmService, ToastService } from '@shared/ui';
import { PermissaoDirective } from '@modules/identity-access/directives';

/**
 * Trechos reutilizáveis: o mesmo aviso escrito uma vez e citado por
 * `{{snippet:CODIGO}}` em várias páginas. A substituição acontece na geração do
 * pacote — a página guarda a referência, não o texto.
 */
@Component({
  selector: 'app-trechos',
  standalone: true,
  imports: [FormsModule, ListPageComponent, BadgeComponent, ButtonComponent, PermissaoDirective],
  templateUrl: './trechos.component.html',
  styleUrl: './trechos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrechosComponent implements OnInit {
  private readonly paginaService = inject(PaginaService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly snippets = signal<PaginaSnippet[]>([]);
  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);
  protected readonly incluirInativos = signal(false);
  protected readonly editando = signal<PaginaSnippet | null>(null);
  protected readonly formAberto = signal(false);

  protected readonly totalAtivos = computed(() => this.snippets().filter(item => item.ativo).length);

  protected form: PaginaSnippetCriacao = this.formVazio();

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.paginaService
      .snippetsPagina(this.incluirInativos())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: itens => this.snippets.set(itens),
        error: () => this.toast.error('Não foi possível carregar os trechos reutilizáveis.'),
      });
  }

  protected alternarInativos(): void {
    this.incluirInativos.update(valor => !valor);
    this.carregar();
  }

  protected novo(): void {
    this.editando.set(null);
    this.form = this.formVazio();
    this.formAberto.set(true);
  }

  protected editar(snippet: PaginaSnippet): void {
    this.editando.set(snippet);
    this.form = {
      codigo: snippet.codigo,
      titulo: snippet.titulo,
      descricao: snippet.descricao ?? '',
      conteudoHtml: snippet.conteudoHtml,
      ativo: snippet.ativo,
    };
    this.formAberto.set(true);
  }

  protected fechar(): void {
    this.formAberto.set(false);
    this.editando.set(null);
  }

  protected salvar(): void {
    if (this.salvando()) return;
    const payload: PaginaSnippetCriacao = {
      ...this.form,
      codigo: this.form.codigo.trim(),
      titulo: this.form.titulo.trim(),
      descricao: this.form.descricao?.trim() || undefined,
    };
    if (!payload.codigo || !payload.titulo || !payload.conteudoHtml.trim()) {
      this.toast.error('Código, título e conteúdo são obrigatórios.');
      return;
    }

    const emEdicao = this.editando();
    const requisicao = emEdicao
      ? this.paginaService.atualizarSnippetPagina(emEdicao.id, payload)
      : this.paginaService.criarSnippetPagina(payload);

    this.salvando.set(true);
    requisicao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.toast.success(emEdicao ? 'Trecho atualizado.' : 'Trecho criado.');
        this.fechar();
        this.carregar();
      },
      error: (erro: { error?: { message?: string } }) =>
        this.toast.error(erro?.error?.message ?? 'Não foi possível salvar o trecho.'),
    });
  }

  protected async excluir(snippet: PaginaSnippet): Promise<void> {
    const confirmado = await this.confirm.confirm({
      title: 'Excluir trecho?',
      message: `As páginas que citam ${snippet.referencia} passarão a exibir um aviso de trecho `
        + 'indisponível no lugar do conteúdo.',
      acceptLabel: 'Excluir trecho',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;

    this.paginaService.excluirSnippetPagina(snippet.id).subscribe({
      next: () => {
        this.toast.success('Trecho excluído.');
        this.carregar();
      },
      error: () => this.toast.error('Não foi possível excluir o trecho.'),
    });
  }

  protected copiarReferencia(snippet: PaginaSnippet): void {
    navigator.clipboard
      .writeText(snippet.referencia)
      .then(() => this.toast.success(`Referência ${snippet.referencia} copiada.`))
      .catch(() => this.toast.error('Não foi possível copiar a referência.'));
  }

  private formVazio(): PaginaSnippetCriacao {
    return { codigo: '', titulo: '', descricao: '', conteudoHtml: '', ativo: true };
  }
}
