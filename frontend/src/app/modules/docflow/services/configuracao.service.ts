import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '@env/environment';

/**
 * Logo global da empresa nos manuais — integrado com `EmpresaController`.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  private readonly logoDisponivel = signal(false);
  private readonly cacheBust = signal(0);

  readonly logoEmpresaUrl = computed(() =>
    this.logoDisponivel() ? `${this.base}/empresa/logo?v=${this.cacheBust()}` : '',
  );

  logoEmpresaExiste(): Observable<boolean> {
    return this.http
      .get(`${this.base}/empresa/logo`, { observe: 'response', responseType: 'blob' })
      .pipe(
        map(res => res.status === 200),
        tap(existe => {
          this.logoDisponivel.set(existe);
          if (existe && this.cacheBust() === 0) {
            this.cacheBust.set(Date.now());
          }
        }),
        catchError(() => {
          this.logoDisponivel.set(false);
          return of(false);
        }),
      );
  }

  uploadLogoEmpresa(file: File): Observable<void> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<void>(`${this.base}/empresa/logo`, form).pipe(
      tap(() => {
        this.logoDisponivel.set(true);
        this.cacheBust.set(Date.now());
      }),
    );
  }

  removerLogoEmpresa(): Observable<void> {
    return this.http.delete<void>(`${this.base}/empresa/logo`).pipe(
      tap(() => {
        this.logoDisponivel.set(false);
        this.cacheBust.set(0);
      }),
    );
  }
}
