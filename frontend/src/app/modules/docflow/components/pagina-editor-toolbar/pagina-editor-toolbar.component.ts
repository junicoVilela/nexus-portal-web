import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type EditorModo = 'rico' | 'codigo' | 'split' | 'preview';

export interface AtalhoEditor {
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-pagina-editor-toolbar',
  standalone: true,
  templateUrl: './pagina-editor-toolbar.component.html',
  styleUrl: './pagina-editor-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaEditorToolbarComponent {
  readonly atalhosEstrutura = input.required<AtalhoEditor[]>();
  readonly atalhosBlocos = input.required<AtalhoEditor[]>();
  readonly modo = input.required<EditorModo>();
  readonly podeTabela = input(false);

  readonly atalhoSelecionado = output<AtalhoEditor>();
  readonly modoChange = output<EditorModo>();
  readonly adicionarLinhaTabela = output<void>();
  readonly removerLinhaTabela = output<void>();
  readonly adicionarColunaTabela = output<void>();
  readonly removerColunaTabela = output<void>();
}
