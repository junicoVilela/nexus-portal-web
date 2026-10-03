import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  Subscription,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
} from 'rxjs';

import { AiTemplateRecomendacao } from '../../models/ai-template-recomendacao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';

/** Valores do formulário do passo 1 que influenciam a recomendação. */
export interface AiBriefingValor {
  briefing?: string;
  templateId?: string;
}

/** Projeto/cliente usados para escopar modelos personalizados na recomendação. */
export interface AiEscopoRecomendacao {
  projetoId: string | null;
  clienteId: string | null;
}

const MINIMO_COMPONENTES = 3;

/**
 * Enquanto o autor digita o briefing, pede ao backend o modelo mais provável e a composição de
 * componentes sugerida; guarda o que o autor aprovou no composer.
 *
 * Componentes vindos de uma página importada têm prioridade sobre a sugestão, desde que formem
 * uma composição válida.
 */
@Injectable()
export class AiRecomendacaoModelo {
  private readonly ai = inject(AiAssistenteService);

  readonly recomendacao = signal<AiTemplateRecomendacao | null>(null);
  readonly carregando = signal(false);
  readonly componentesSelecionados = signal<string[]>([]);
  private importadosPendentes: string[] | null = null;

  /** Blocos obrigatórios mantidos e pelo menos três componentes selecionados. */
  readonly composicaoValida = computed(() => {
    const componentes = this.recomendacao()?.componentes ?? [];
    const selecionados = this.componentesSelecionados();
    if (!componentes.length && !selecionados.length) return true;
    return (
      selecionados.length >= MINIMO_COMPONENTES &&
      componentes.filter(item => item.obrigatorio).every(item => selecionados.includes(item.id))
    );
  });

  /** Recomenda a cada pausa na digitação (briefing ≥ 20 caracteres). */
  observar(valores: Observable<AiBriefingValor>, escopo: () => AiEscopoRecomendacao): Subscription {
    return valores
      .pipe(
        debounceTime(450),
        distinctUntilChanged(
          (anterior, atual) =>
            anterior.briefing === atual.briefing && anterior.templateId === atual.templateId,
        ),
        switchMap(valor => {
          const texto = valor.briefing?.trim() ?? '';
          if (texto.length < 20) {
            this.recomendacao.set(null);
            this.componentesSelecionados.set([]);
            return of(null);
          }
          this.carregando.set(true);
          return this.ai
            .recomendarTemplate({ briefing: texto, ...escopo(), templateId: valor.templateId || null })
            .pipe(
              catchError(() => of(null)),
              finalize(() => this.carregando.set(false)),
            );
        }),
      )
      .subscribe(recomendacao => this.aplicar(recomendacao));
  }

  aplicar(recomendacao: AiTemplateRecomendacao | null): void {
    this.recomendacao.set(recomendacao);
    const importados = this.importadosPendentes;
    if (recomendacao && importados && importados.length >= MINIMO_COMPONENTES) {
      this.componentesSelecionados.set(importados);
      this.importadosPendentes = null;
      return;
    }
    this.componentesSelecionados.set(recomendacao?.componentes.map(item => item.id) ?? []);
    if (recomendacao) this.importadosPendentes = null;
  }

  /** Composição já aprovada na revisão da importação; aplicada quando a recomendação chegar. */
  usarComponentesImportados(ids: string[]): void {
    this.importadosPendentes = [...ids];
  }

  selecionar(ids: string[]): void {
    this.componentesSelecionados.set(ids);
  }
}
