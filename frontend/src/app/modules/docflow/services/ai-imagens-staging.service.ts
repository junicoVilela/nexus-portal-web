import { Injectable } from '@angular/core';

/**
 * Transfere arquivos do assistente IA → `pagina-form` sem serializar no history.state.
 * Consumido uma vez ao aplicar a proposta no editor.
 */
@Injectable({ providedIn: 'root' })
export class AiImagensStagingService {
  private arquivos: File[] = [];

  stash(files: File[]): void {
    this.arquivos = [...files];
  }

  /** Retorna e limpa o staging. */
  consume(): File[] {
    const out = this.arquivos;
    this.arquivos = [];
    return out;
  }

  peek(): readonly File[] {
    return this.arquivos;
  }

  clear(): void {
    this.arquivos = [];
  }
}
