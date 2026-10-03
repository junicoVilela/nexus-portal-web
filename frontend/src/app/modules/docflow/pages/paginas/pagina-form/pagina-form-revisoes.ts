import { Injectable, inject, signal } from '@angular/core';

import { PaginaRevisao } from '@modules/docflow/models/pagina.model';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { DiffLinha, diffLinhasPalavras } from '@modules/docflow/utils/diff.util';
import { ToastService } from '@shared/ui';
import { SortDirection } from '@shared/utils/query-state';

/** O que o histórico precisa saber do editor. */
export interface PaginaFormRevisoesContexto {
  /** Página em edição; sem id não há histórico. */
  paginaId(): string | undefined;
  /** Ordenação e diff ficam na URL do editor. */
  estadoMudou(): void;
}

/**
 * Histórico de revisões da página no editor: paginação, ordenação e diff entre as duas revisões
 * mais recentes. Escopo do `pagina-form` (`providers`).
 */
@Injectable()
export class PaginaFormRevisoes {
  private readonly paginaService = inject(PaginaService);
  private readonly toast = inject(ToastService);
  private contexto?: PaginaFormRevisoesContexto;

  readonly revisoes = signal<PaginaRevisao[]>([]);
  readonly totalRevisoes = signal(0);
  readonly revisoesPage = signal(1);
  readonly revisoesPageSize = signal(10);
  readonly revisoesSort = signal('numero');
  readonly revisoesDir = signal<SortDirection>('DESC');
  readonly showDiff = signal(false);
  readonly diffLinhas = signal<DiffLinha[]>([]);
  readonly diffConteudoAnterior = signal('');
  readonly diffConteudoAtual = signal('');

  configurar(contexto: PaginaFormRevisoesContexto): void {
    this.contexto = contexto;
  }

  /** Recarrega da primeira página (ex.: depois de salvar). */
  recarregar(): void {
    this.revisoesPage.set(1);
    this.carregar();
  }

  /** Página nova: sem histórico. */
  limpar(): void {
    this.revisoes.set([]);
    this.totalRevisoes.set(0);
  }

  alterarPagina(page: number): void {
    this.revisoesPage.set(page);
    this.carregar();
  }

  alterarTamanhoPagina(size: number): void {
    this.revisoesPageSize.set(size);
    this.recarregar();
  }

  ordenar(campo: string): void {
    if (this.revisoesSort() === campo) {
      this.revisoesDir.set(this.revisoesDir() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.revisoesSort.set(campo);
      this.revisoesDir.set('ASC');
    }
    this.contexto?.estadoMudou();
    this.recarregar();
  }

  /** Compara as duas revisões mais recentes (conteúdo; cai para o título se vazio). */
  async alternarDiff(): Promise<void> {
    this.showDiff.update(v => !v);
    this.contexto?.estadoMudou();
    const lista = this.revisoes();
    if (this.showDiff() && lista.length >= 2) {
      const htmlAnterior = lista[1].conteudoHtml ?? '';
      const htmlAtual = lista[0].conteudoHtml ?? '';
      this.diffConteudoAnterior.set(htmlAnterior);
      this.diffConteudoAtual.set(htmlAtual);
      this.diffLinhas.set(
        await diffLinhasPalavras(htmlAnterior || lista[1].titulo || '', htmlAtual || lista[0].titulo || ''),
      );
    } else {
      this.diffConteudoAnterior.set('');
      this.diffConteudoAtual.set('');
    }
  }

  carregar(): void {
    const paginaId = this.contexto?.paginaId();
    if (!paginaId) return;
    this.paginaService
      .listarRevisoesPagina(
        paginaId,
        this.revisoesPage(),
        this.revisoesPageSize(),
        this.revisoesSort(),
        this.revisoesDir(),
      )
      .subscribe({
        next: response => {
          this.revisoes.set(response.items);
          this.totalRevisoes.set(response.totalItems);
          this.revisoesPage.set(response.page);
          this.revisoesPageSize.set(response.size);
        },
        error: () => this.toast.error('Erro ao carregar revisões.'),
      });
  }
}
