import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent } from '@shared/ui';
import { AiImagemAnexo } from '../../models/ai-imagem-anexo.model';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ARQUIVOS = 12;

@Component({
  selector: 'app-ai-imagens-dropzone',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent],
  templateUrl: './ai-imagens-dropzone.component.html',
  styleUrl: './ai-imagens-dropzone.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiImagensDropzoneComponent {
  readonly disabled = input(false);
  readonly imagens = input<AiImagemAnexo[]>([]);

  readonly imagensChange = output<AiImagemAnexo[]>();
  readonly erroChange = output<string | null>();

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  protected readonly arrastando = signal(false);

  protected abrirSeletor(): void {
    if (this.disabled()) return;
    this.fileInput()?.nativeElement.click();
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.adicionarArquivos(Array.from(input.files ?? []));
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.arrastando.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.arrastando.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.arrastando.set(false);
    this.adicionarArquivos(Array.from(event.dataTransfer?.files ?? []));
  }

  protected remover(id: string): void {
    const atual = this.imagens();
    const alvo = atual.find(i => i.id === id);
    if (alvo) URL.revokeObjectURL(alvo.previewUrl);
    this.imagensChange.emit(atual.filter(i => i.id !== id));
    this.erroChange.emit(null);
  }

  protected tamanhoKb(bytes: number): string {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  private adicionarArquivos(files: File[]): void {
    if (!files.length) return;
    this.erroChange.emit(null);

    const atuais = [...this.imagens()];
    const erros: string[] = [];

    for (const file of files) {
      if (atuais.length >= MAX_ARQUIVOS) {
        erros.push(`Limite de ${MAX_ARQUIVOS} imagens.`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        erros.push(`“${file.name}” não é imagem.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        erros.push(`“${file.name}” passa de 8 MB.`);
        continue;
      }
      if (atuais.some(i => i.nome === file.name && i.tamanhoBytes === file.size)) {
        continue;
      }
      atuais.push({
        id: crypto.randomUUID(),
        file,
        nome: file.name,
        previewUrl: URL.createObjectURL(file),
        tamanhoBytes: file.size,
      });
    }

    this.imagensChange.emit(atuais);
    if (erros.length) this.erroChange.emit(erros[0]!);
  }
}
