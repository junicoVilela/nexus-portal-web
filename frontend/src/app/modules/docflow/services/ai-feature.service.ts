import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

import { AiStatus } from '../models/ai-status.model';
import { AiAssistenteService } from './ai-assistente.service';

/**
 * Feature flag runtime do assistente IA no DocFlow (`GET /ai/status`).
 * CTAs DocFlow / nav só aparecem quando {@code enabled=true}.
 */
@Injectable({ providedIn: 'root' })
export class AiFeatureService {
  private readonly ai = inject(AiAssistenteService);
  private readonly statusSignal = signal<AiStatus | null>(null);
  private readonly readySignal = signal(false);
  private carregando = false;

  readonly status = this.statusSignal.asReadonly();
  readonly ready = this.readySignal.asReadonly();
  readonly disponivel = computed(() => !!this.statusSignal()?.enabled);
  readonly prontoParaGerar = computed(() => !!this.statusSignal()?.prontoParaGerar);

  /** Carrega status uma vez (idempotente). */
  ensureLoaded(): void {
    if (this.readySignal() || this.carregando) return;
    this.refresh().subscribe();
  }

  refresh(): Observable<AiStatus | null> {
    this.carregando = true;
    return this.ai.status().pipe(
      tap(s => {
        this.statusSignal.set(s);
        this.readySignal.set(true);
        this.carregando = false;
      }),
      catchError(() => {
        this.statusSignal.set(null);
        this.readySignal.set(true);
        this.carregando = false;
        return of(null);
      }),
    );
  }

  /** Força status em memória (testes / hidratação). */
  hydrate(status: AiStatus | null): void {
    this.statusSignal.set(status);
    this.readySignal.set(true);
  }
}
