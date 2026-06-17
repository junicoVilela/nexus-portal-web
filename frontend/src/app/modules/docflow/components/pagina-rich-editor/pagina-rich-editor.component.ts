import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

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
      [editor]="editor"
      [formControl]="control()"
      outputFormat="html"
      placeholder="Comece a escrever o conteúdo da página..."
    ></ngx-editor>
  `,
  styleUrls: ['./pagina-rich-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaRichEditorComponent implements OnInit, OnDestroy {
  readonly control = input.required<FormControl<string>>();
  readonly toolbar = TOOLBAR;
  editor!: Editor;

  ngOnInit(): void {
    this.editor = new Editor();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}
