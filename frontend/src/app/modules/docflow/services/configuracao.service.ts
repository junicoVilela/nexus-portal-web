import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { environment } from '@env/environment';

const STORAGE_KEY = 'doc-flow:empresa-logo';

/**
 * Mock in-memory persistido em localStorage do logo da empresa exibido nos manuais.
 * Armazena como data URL para ser usado diretamente em `<img [src]="...">`.
 *
 * Quando o backend estiver pronto, basta voltar a chamar `/empresa/logo` via
 * `HttpClient` preservando esta assinatura.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  /** Data URL do logo (ou string vazia). Usado em `<img [src]>`. */
  get logoEmpresaUrl(): string {
    return this.lerArmazenado();
  }

  logoEmpresaExiste(): Observable<boolean> {
    return this.simular(this.lerArmazenado().length > 0);
  }

  uploadLogoEmpresa(file: File): Observable<void> {
    return new Observable<void>(subscriber => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        try {
          localStorage.setItem(STORAGE_KEY, dataUrl);
          setTimeout(() => {
            subscriber.next();
            subscriber.complete();
          }, environment.mockDelayMs);
        } catch (err) {
          subscriber.error(err);
        }
      };
      reader.onerror = () => subscriber.error(reader.error);
      reader.readAsDataURL(file);
    });
  }

  removerLogoEmpresa(): Observable<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage indisponível */
    }
    return this.simular<void>(undefined);
  }

  private lerArmazenado(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private simular<T>(value: T): Observable<T> {
    const ms = environment.mockDelayMs;
    return ms > 0 ? of(value).pipe(delay(ms)) : of(value);
  }
}
