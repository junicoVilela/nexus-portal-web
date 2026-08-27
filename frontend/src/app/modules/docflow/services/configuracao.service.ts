import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '@env/environment';
import {
  docflowEmpresaDeleteLogo as deleteLogoSdk,
  docflowEmpresaGetLogo as getLogoSdk,
  docflowEmpresaUploadLogo as uploadLogoSdk,
} from '../../../api/generated/sdk.gen';

/**
 * Logo global da empresa nos manuais — integrado com `EmpresaController`.
 */
@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private readonly injector = inject(Injector);
  private readonly base = environment.apiUrl;

  private readonly logoDisponivel = signal(false);
  private readonly cacheBust = signal(0);

  readonly logoEmpresaUrl = computed(() =>
    this.logoDisponivel() ? `${this.base}/empresa/logo?v=${this.cacheBust()}` : '',
  );

  logoEmpresaExiste(): Observable<boolean> {
    return defer(() => getLogoSdk({ injector: this.injector, throwOnError: false })).pipe(
      map(resposta => {
        const existe = !('error' in resposta && resposta.error) && !!resposta.data;
        this.logoDisponivel.set(existe);
        if (existe && this.cacheBust() === 0) {
          this.cacheBust.set(Date.now());
        }
        return existe;
      }),
      catchError(() => {
        this.logoDisponivel.set(false);
        return of(false);
      }),
    );
  }

  uploadLogoEmpresa(file: File): Observable<void> {
    return defer(() => uploadLogoSdk({ body: { file }, injector: this.injector })).pipe(
      tap(() => {
        this.logoDisponivel.set(true);
        this.cacheBust.set(Date.now());
      }),
      map(() => undefined),
    );
  }

  removerLogoEmpresa(): Observable<void> {
    return defer(() => deleteLogoSdk({ injector: this.injector })).pipe(
      tap(() => {
        this.logoDisponivel.set(false);
        this.cacheBust.set(0);
      }),
      map(() => undefined),
    );
  }
}
