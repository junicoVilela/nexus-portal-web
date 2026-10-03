import { Injectable, inject } from '@angular/core';
import { FormControl } from '@angular/forms';

import { PaginaRichEditorComponent } from '@modules/docflow/components/pagina-rich-editor';
import {
  adicionarColunaHtml,
  adicionarLinhaHtml,
  contagemTabelasHtml,
  decorarTabelasNoDom,
  removerColunaHtml,
  removerUltimaLinhaHtml,
} from '@modules/docflow/components/pagina-rich-editor/pagina-table-html';
import { ToastService } from '@shared/ui';

export type DimensaoTabela = 'linha' | 'coluna';
export type AcaoTabela = 'add' | 'remove';

/** O que as tabelas precisam do editor. */
export interface PaginaFormTabelasContexto {
  conteudo: FormControl<string>;
  /** Editor rico, só quando ele é o modo ativo (a seleção dele decide a célula). */
  editorRico(): PaginaRichEditorComponent | undefined;
  /** Corpo da prévia onde ficam os botões de linha/coluna; ausente no modo código. */
  previaRoot(): HTMLElement | undefined;
  /** Conteúdo alterado fora da digitação. */
  alterado(): void;
}

const OPERACOES = {
  linha: { add: adicionarLinhaHtml, remove: removerUltimaLinhaHtml },
  coluna: { add: adicionarColunaHtml, remove: removerColunaHtml },
} as const;

/**
 * Linhas e colunas das tabelas (dicionários de campos) no editor: pela toolbar, pela seleção do
 * editor rico ou pelos botões desenhados na prévia. Escopo do `pagina-form` (`providers`).
 */
@Injectable()
export class PaginaFormTabelas {
  private readonly toast = inject(ToastService);
  private contexto?: PaginaFormTabelasContexto;
  /** Evita redesenhar os botões da prévia a cada ciclo de detecção. */
  private assinaturaDecorada = '';

  configurar(contexto: PaginaFormTabelasContexto): void {
    this.contexto = contexto;
  }

  /**
   * No modo rico, a seleção do editor decide a célula; nos demais (ou sem seleção em tabela),
   * altera a tabela {@code tableIndex} direto no HTML.
   */
  alterar(dimensao: DimensaoTabela, acao: AcaoTabela, tableIndex = 0): void {
    const ctx = this.ctx();
    const atual = ctx.conteudo.value ?? '';
    if (contagemTabelasHtml(atual) === 0) {
      this.toast.warn(
        dimensao === 'linha'
          ? 'Inclua um dicionário/tabela no conteúdo antes de adicionar linhas.'
          : 'Inclua um dicionário/tabela no conteúdo antes de alterar colunas.',
      );
      return;
    }

    const editor = ctx.editorRico();
    if (dimensao === 'linha' && editor?.podeAdicionar()) {
      if (acao === 'add') editor.adicionarLinhaTabela();
      else editor.removerLinhaTabela();
      return;
    }
    if (dimensao === 'coluna' && editor?.podeAdicionarColuna()) {
      if (acao === 'add') editor.adicionarColunaTabela();
      else editor.removerColunaTabela();
      return;
    }

    const proximo = OPERACOES[dimensao][acao](atual, tableIndex);
    if (proximo === atual && acao === 'remove') {
      this.toast.warn(`A tabela precisa manter ao menos uma ${dimensao}.`);
      return;
    }
    ctx.conteudo.setValue(proximo);
    ctx.conteudo.markAsDirty();
    ctx.alterado();
    editor?.aplicarHtml(proximo);
    this.invalidarDecoracao();
  }

  /** Clique nos botões `[data-table-action]` desenhados na prévia. */
  aoClicarPrevia(event: MouseEvent): void {
    const alvo = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-table-action]');
    if (!alvo) return;
    event.preventDefault();
    const index = Number(alvo.dataset['tableIndex'] ?? '0');
    const acoes: Record<string, [DimensaoTabela, AcaoTabela]> = {
      'add-row': ['linha', 'add'],
      'remove-row': ['linha', 'remove'],
      'add-col': ['coluna', 'add'],
      'remove-col': ['coluna', 'remove'],
    };
    const acao = acoes[alvo.dataset['tableAction'] ?? ''];
    if (acao) this.alterar(acao[0], acao[1], index);
  }

  /** Desenha os botões de linha/coluna na prévia quando o conteúdo ou o modo mudou. */
  decorarPrevia(modo: string): void {
    const root = this.ctx().previaRoot();
    if (!root || modo === 'codigo') return;
    const html = this.ctx().conteudo.value ?? '';
    const assinatura = `${modo}|${html.length}|${contagemTabelasHtml(html)}`;
    if (assinatura === this.assinaturaDecorada && root.querySelector('.pf-table-chrome')) return;

    decorarTabelasNoDom(root);
    this.assinaturaDecorada = assinatura;
  }

  invalidarDecoracao(): void {
    this.assinaturaDecorada = '';
  }

  private ctx(): PaginaFormTabelasContexto {
    if (!this.contexto) throw new Error('PaginaFormTabelas: chame configurar() antes de usar.');
    return this.contexto;
  }
}
