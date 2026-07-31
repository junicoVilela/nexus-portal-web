import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { EditorState, TextSelection } from 'prosemirror-state';
import { DOCFLOW_EDITOR_SCHEMA } from './docflow-editor.schema';
import {
  extrairConteudoInlineParaCelula,
  inserirDocInlineNaSelecao,
  inserirHtmlNaSelecao,
} from './pagina-insert-html';
import {
  adicionarLinha,
  contextoTabela,
  podeAdicionarLinha,
  podeRemoverLinha,
  removerLinha,
} from './pagina-rich-editor-table';
import { compactarCelulasTabelaHtml } from './pagina-table-html';

const TOOLBAR: Toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['code', 'blockquote'],
  ['ordered_list', 'bullet_list'],
  [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
  ['link', 'image'],
  ['text_color', 'background_color'],
  ['align_left', 'align_center', 'align_right', 'align_justify'],
  ['horizontal_rule', 'format_clear'],
];

@Component({
  selector: 'app-pagina-rich-editor',
  standalone: true,
  imports: [ReactiveFormsModule, NgxEditorModule, LucideAngularModule],
  template: `
    <div class="df-editor-shell">
      <ngx-editor-menu [editor]="editor" [toolbar]="toolbar"></ngx-editor-menu>
      <div class="df-table-tools" role="toolbar" aria-label="Ferramentas de tabela">
        <span class="df-table-tools__label">Tabela</span>
        <button
          type="button"
          class="df-table-tools__btn"
          [disabled]="!podeAdicionar()"
          (click)="adicionarLinhaTabela()"
          title="Adicionar linha abaixo"
          aria-label="Adicionar linha na tabela"
        >
          <lucide-icon name="Plus" [size]="14" aria-hidden="true" />
          Linha
        </button>
        <button
          type="button"
          class="df-table-tools__btn df-table-tools__btn--danger"
          [disabled]="!podeRemover()"
          (click)="removerLinhaTabela()"
          title="Remover linha atual"
          aria-label="Remover linha da tabela"
        >
          <lucide-icon name="Minus" [size]="14" aria-hidden="true" />
          Linha
        </button>
        @if (!podeAdicionar()) {
          <span class="df-table-tools__hint">Clique em uma célula da tabela para habilitar</span>
        }
      </div>
      <div class="df-editor-body">
        <ngx-editor
          class="df-doc-editor"
          [editor]="editor"
          [formControl]="control()"
          outputFormat="html"
          placeholder="Comece a escrever o conteúdo da página..."
          (keydown)="aoPressionarTecla($event)"
        ></ngx-editor>
        @if (floatVisivel()) {
          <div
            class="df-table-float"
            [style.top.px]="floatTop()"
            [style.left.px]="floatLeft()"
            role="toolbar"
            aria-label="Ações da tabela selecionada"
          >
            <button type="button" class="df-table-float__btn" (click)="adicionarLinhaTabela()" title="Adicionar linha">
              <lucide-icon name="Plus" [size]="16" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="df-table-float__btn df-table-float__btn--danger"
              [disabled]="!podeRemover()"
              (click)="removerLinhaTabela()"
              title="Remover linha"
            >
              <lucide-icon name="Minus" [size]="16" aria-hidden="true" />
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./pagina-rich-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaRichEditorComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly control = input.required<FormControl<string>>();
  readonly slashSolicitado = output<void>();
  readonly toolbar = TOOLBAR;
  readonly podeAdicionar = signal(false);
  readonly podeRemover = signal(false);
  readonly floatVisivel = signal(false);
  readonly floatTop = signal(0);
  readonly floatLeft = signal(0);
  editor!: Editor;
  /** Posição salva ao sair do editor (ex.: abrir biblioteca) para inserir na célula certa. */
  private ultimaSelecao: { from: number; to: number } | null = null;

  ngOnInit(): void {
    this.editor = new Editor({ schema: DOCFLOW_EDITOR_SCHEMA });
    this.editor.update.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.guardarSelecao();
      this.atualizarFerramentasTabela();
    });
    this.atualizarFerramentasTabela();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  /** Chame antes de abrir a biblioteca — o clique tira o foco da célula. */
  guardarSelecao(): void {
    try {
      const sel = this.editor?.view?.state?.selection;
      if (!sel) return;
      this.ultimaSelecao = { from: sel.from, to: sel.to };
    } catch {
      /* editor ainda não montado */
    }
  }

  inserirHtml(html: string): void {
    const view = this.editor?.view;
    if (!view) return;

    this.restaurarSelecao();
    const htmlFinal = this.prepararHtmlParaInsercao(html);
    view.focus();
    this.restaurarSelecao();

    // Badges/spans com classe: insertHTML do ngx-editor usa parseSlice aberto e perde o wrapper.
    const ehBadgeInline = /class\s*=\s*["'][^"']*\b(status-badge|number-badge|filter-chip)\b/.test(htmlFinal);
    if (ehBadgeInline && inserirDocInlineNaSelecao(view, htmlFinal)) {
      this.sincronizarControle();
      this.atualizarFerramentasTabela();
      return;
    }

    inserirHtmlNaSelecao(view, htmlFinal);
    this.sincronizarControle();
    this.atualizarFerramentasTabela();
  }

  /** Substitui o conteúdo completo (usado quando a ação parte da toolbar/prévia). */
  aplicarHtml(html: string): void {
    this.editor.setContent(compactarCelulasTabelaHtml(html || '<p></p>'));
    this.sincronizarControle();
    this.atualizarFerramentasTabela();
  }

  adicionarLinhaTabela(): void {
    const view = this.editor?.view;
    if (!view) return;
    const ok = adicionarLinha(view.state, tr => view.dispatch(tr));
    if (ok) {
      view.focus();
      this.sincronizarControle();
      this.atualizarFerramentasTabela();
    }
  }

  removerLinhaTabela(): void {
    const view = this.editor?.view;
    if (!view) return;
    const ok = removerLinha(view.state, tr => view.dispatch(tr));
    if (ok) {
      view.focus();
      this.sincronizarControle();
      this.atualizarFerramentasTabela();
    }
  }

  aoPressionarTecla(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const selection = this.editor?.view?.state.selection;
    if (!selection?.empty) return;
    const $from = selection.$from;
    const textoAntesDoCursor = $from.parent.textBetween(0, $from.parentOffset, '', '');
    if (textoAntesDoCursor.trim()) return;
    event.preventDefault();
    this.guardarSelecao();
    this.slashSolicitado.emit();
  }

  private restaurarSelecao(): void {
    const view = this.editor?.view;
    if (!view || !this.ultimaSelecao) return;
    const max = view.state.doc.content.size;
    const from = Math.max(1, Math.min(this.ultimaSelecao.from, max));
    const to = Math.max(from, Math.min(this.ultimaSelecao.to, max));
    try {
      const selection = TextSelection.create(view.state.doc, from, to);
      view.dispatch(view.state.tr.setSelection(selection));
    } catch {
      try {
        view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(from))));
      } catch {
        /* seleção inválida — deixa a atual */
      }
    }
  }

  /** Em célula de tabela, reduz bloco de exemplos a um badge inline. */
  private prepararHtmlParaInsercao(html: string): string {
    const state = this.editor.view.state;
    const ctx = contextoTabela(state);
    if (!ctx) return html;

    const inline = extrairConteudoInlineParaCelula(html);
    if (inline) return inline;

    // Bloco grande (seção/tabela): coloca depois da tabela atual, não no fim do doc.
    const pos = Math.min(ctx.tablePos + ctx.tableNode.nodeSize, state.doc.content.size);
    try {
      const selection = TextSelection.near(state.doc.resolve(pos));
      this.editor.view.dispatch(state.tr.setSelection(selection));
      this.ultimaSelecao = { from: selection.from, to: selection.to };
    } catch {
      /* mantém seleção */
    }
    return html;
  }

  private atualizarFerramentasTabela(): void {
    try {
      const state = this.editor?.view?.state;
      if (!state?.selection?.$from) {
        this.podeAdicionar.set(false);
        this.podeRemover.set(false);
        this.floatVisivel.set(false);
        return;
      }
      const podeAdd = podeAdicionarLinha(state);
      this.podeAdicionar.set(podeAdd);
      this.podeRemover.set(podeRemoverLinha(state));
      if (!podeAdd) {
        this.floatVisivel.set(false);
        return;
      }
      this.posicionarFloat(state);
    } catch {
      this.podeAdicionar.set(false);
      this.podeRemover.set(false);
      this.floatVisivel.set(false);
    }
  }

  private posicionarFloat(state: EditorState): void {
    const view = this.editor.view;
    const body = this.host.nativeElement.querySelector('.df-editor-body') as HTMLElement | null;
    if (!view || !body) {
      this.floatVisivel.set(false);
      return;
    }

    const ctx = contextoTabela(state);
    let table: HTMLElement | null = null;
    if (ctx) {
      const dom = view.nodeDOM(ctx.tablePos);
      if (dom instanceof HTMLElement) {
        table = dom.tagName === 'TABLE' ? dom : dom.querySelector('table') ?? dom.closest('table');
      }
    }
    if (!table) {
      const near = view.domAtPos(state.selection.from).node;
      const el = near instanceof Element ? near : near.parentElement;
      table = el?.closest('table') ?? null;
    }
    if (!table) {
      this.floatVisivel.set(false);
      return;
    }

    const tableRect = table.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    this.floatTop.set(Math.max(8, tableRect.top - bodyRect.top + body.scrollTop - 6));
    this.floatLeft.set(Math.max(8, tableRect.right - bodyRect.left + body.scrollLeft - 88));
    this.floatVisivel.set(true);
  }

  private sincronizarControle(): void {
    const conteudo = compactarCelulasTabelaHtml(this.editor.view.dom.innerHTML);
    this.control().setValue(conteudo);
    this.control().markAsDirty();
  }
}
