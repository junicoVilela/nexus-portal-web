import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { PaginaAnexo } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ConfirmService, ToastService } from '@shared/ui';
import { escapeHtml } from '@shared/utils/janela-preview';
import { PaginaFormPersistencia } from './pagina-form-persistencia';

/**
 * Anexos da página no editor: lista, remoção e envio de imagens. Página nova ganha um rascunho na
 * hora do primeiro envio (anexo precisa de id). Escopo do `pagina-form` (`providers`).
 */
@Injectable()
export class PaginaFormAnexos {
  private readonly paginaService = inject(PaginaService);
  private readonly persistencia = inject(PaginaFormPersistencia);
  private readonly confirmService = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private paginaId?: string;

  readonly anexos = signal<PaginaAnexo[]>([]);
  readonly url = (anexo: PaginaAnexo): string => this.paginaService.downloadAnexoUrl(anexo);

  carregar(paginaId: string): void {
    this.paginaId = paginaId;
    this.paginaService.anexosPagina(paginaId).subscribe({
      next: anexos => this.anexos.set(anexos),
      error: () => this.toast.error('Erro ao carregar anexos.'),
    });
  }

  /** Página nova ("salvar e criar próxima"). */
  limpar(): void {
    this.paginaId = undefined;
    this.anexos.set([]);
  }

  /**
   * Envia as imagens e devolve o HTML (`<figure>`) para inserir no conteúdo.
   * @returns `undefined` se não deu para criar o rascunho ou o envio falhou (já avisado).
   */
  async enviarImagens(files: File[], mensagemFalha = 'Erro ao anexar imagem.'): Promise<string | undefined> {
    const paginaId = await this.persistencia.garantirRascunho('adicionar imagens');
    if (!paginaId) return undefined;
    this.paginaId = paginaId;
    try {
      const figuras = await Promise.all(files.map(file => this.enviarImagem(paginaId, file)));
      return figuras.join('\n');
    } catch (error) {
      this.toast.error(mensagemErro(error, mensagemFalha));
      return undefined;
    }
  }

  async excluir(anexo: PaginaAnexo): Promise<void> {
    const paginaId = this.paginaId;
    if (!paginaId) return;
    const ok = await this.confirmService.confirm({
      title: 'Remover anexo?',
      message: `O arquivo "${anexo.nomeOriginal}" será removido permanentemente desta página.`,
      acceptLabel: 'Remover',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!ok) return;
    this.paginaService.excluirAnexoPagina(paginaId, anexo.id).subscribe({
      next: () => {
        this.anexos.update(list => list.filter(item => item.id !== anexo.id));
        this.toast.success('Anexo removido.');
      },
      error: () => this.toast.error('Erro ao remover anexo.'),
    });
  }

  private async enviarImagem(paginaId: string, file: File): Promise<string> {
    const anexo = await firstValueFrom(this.paginaService.anexarPagina(paginaId, file));
    this.anexos.update(list => [anexo, ...list]);
    const nome = escapeHtml(anexo.nomeOriginal);
    return `<figure class="photo"><img src="${this.url(anexo)}" alt="${nome}"><figcaption>${nome}</figcaption></figure>`;
  }
}

function mensagemErro(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (typeof error.error?.message === 'string') return error.error.message;
  return fallback;
}
