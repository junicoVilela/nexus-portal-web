import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { DOCFLOW_EDITOR_SCHEMA } from './docflow-editor.schema';

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
  imports: [ReactiveFormsModule, NgxEditorModule],
  template: `
    <ngx-editor-menu [editor]="editor" [toolbar]="toolbar"></ngx-editor-menu>
    <ngx-editor
      class="df-doc-editor"
      [editor]="editor"
      [formControl]="control()"
      outputFormat="html"
      placeholder="Comece a escrever o conteúdo da página..."
      (keydown)="aoPressionarTecla($event)"
    ></ngx-editor>
  `,
  styleUrls: ['./pagina-rich-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaRichEditorComponent implements OnInit, OnDestroy {
  readonly control = input.required<FormControl<string>>();
  readonly slashSolicitado = output<void>();
  readonly toolbar = TOOLBAR;
  editor!: Editor;

  ngOnInit(): void {
    this.editor = new Editor({ schema: DOCFLOW_EDITOR_SCHEMA });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  inserirHtml(html: string): void {
    this.editor.commands.focus().insertHTML(html).exec();
  }

  aoPressionarTecla(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const selection = this.editor?.view?.state.selection;
    if (!selection?.empty) return;
    const $from = selection.$from;
    const textoAntesDoCursor = $from.parent.textBetween(0, $from.parentOffset, '', '');
    if (textoAntesDoCursor.trim()) return;
    event.preventDefault();
    this.slashSolicitado.emit();
  }
}
