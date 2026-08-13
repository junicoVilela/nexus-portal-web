import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { AiModuloDocumento, AiPaginaDocumento } from '../../models/ai-documento-importacao.model';

export interface AiDocumentoPreviewDialogData {
  pagina: AiPaginaDocumento;
  modulo: AiModuloDocumento;
}

@Component({
  selector: 'app-ai-documento-preview-dialog',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './ai-documento-preview-dialog.component.html',
  styleUrl: './ai-documento-preview-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDocumentoPreviewDialogComponent implements OnInit {
  protected readonly data = inject<AiDocumentoPreviewDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);

  protected readonly conteudoHtml = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const { marked } = await import('marked');
    this.conteudoHtml.set(
      marked.parse(this.data.pagina.briefing, {
        async: false,
      }) as string,
    );
  }

  protected fechar(): void {
    this.dialogRef.close();
  }
}
