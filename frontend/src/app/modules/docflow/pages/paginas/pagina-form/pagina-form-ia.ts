import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { AiAssistenteService } from '@modules/docflow/services/ai-assistente.service';
import { AiImagensStagingService } from '@modules/docflow/services/ai-imagens-staging.service';
import { compactQueryParams } from '@shared/utils/query-state';

/** Proposta que o assistente (wizard ou central de revisão) entrega ao editor via `history.state`. */
export interface PropostaAiNavegacao {
  sessaoId?: string | null;
  titulo?: string;
  slug?: string;
  codigoTela?: string;
  resumo?: string | null;
  conteudoHtml?: string;
  templateOrigemId?: string | null;
  templateOrigemVersao?: number | null;
  moduloId?: string | null;
}

/**
 * Ligação do editor com o assistente de IA: de onde vem a proposta, imagens do assistente,
 * vínculo proposta → página salva e o painel "Ajustar com IA". O que fazer com o formulário fica
 * no componente. Escopo do `pagina-form` (`providers`).
 */
@Injectable()
export class PaginaFormIa {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly ai = inject(AiAssistenteService);
  private readonly imagensStaging = inject(AiImagensStagingService);

  /** Painel "Ajustar com IA" (Fase B) aberto no editor. */
  readonly painelAjusteAberto = signal(false);
  /** Sessão que originou esta página nova; vinculada quando a página ganha id. */
  private sessaoOrigem: string | null = null;

  /**
   * `?origem=ia` (CTA da lista) leva ao wizard `/doc-flow/assistente`, a menos que já exista uma
   * proposta no `history.state` para aplicar aqui.
   */
  redirecionarSeOrigemIa(): boolean {
    const origem = this.route.snapshot.queryParamMap.get('origem');
    if (origem !== 'ia' && origem !== 'ai') return false;
    const state = this.estadoNavegacao();
    if (state?.['origem'] === 'ai' && state?.['proposta']) return false;

    const qp = this.route.snapshot.queryParamMap;
    void this.router.navigate(docFlowRouterCommands(['assistente']), {
      replaceUrl: true,
      queryParams: compactQueryParams({
        projetoId: qp.get('projetoId'),
        moduloId: qp.get('moduloId'),
        parentId: qp.get('parentId'),
        templateId: qp.get('templateId'),
      }),
    });
    return true;
  }

  /**
   * Lê a proposta entregue pelo assistente, uma única vez. `history.state` sobrevive ao F5: sem
   * limpá-lo, o reload restauraria o backup local e reaplicaria a proposta por cima das edições.
   */
  consumirProposta(): PropostaAiNavegacao | null {
    const state = this.estadoNavegacao();
    const proposta = state?.['proposta'] as PropostaAiNavegacao | undefined;
    if (!proposta || state?.['origem'] !== 'ai') return null;
    this.sessaoOrigem = proposta.sessaoId ?? null;
    if (typeof history !== 'undefined' && history.state) {
      const limpo = { ...history.state };
      delete limpo['origem'];
      delete limpo['proposta'];
      history.replaceState(limpo, '');
    }
    return proposta;
  }

  /** Imagens arrastadas no assistente, para anexar à página (entregues uma única vez). */
  imagensPendentes(): File[] {
    return this.imagensStaging.consume();
  }

  /**
   * A primeira vez que a página vinda de uma proposta ganha id, a API marca a proposta como aceita
   * e guarda a página — base do aceite e do "texto mantido" no painel de qualidade. Falhar aqui
   * não pode atrapalhar o salvamento: o vínculo é só métrica.
   */
  vincularPagina(paginaId: string): void {
    const sessaoId = this.sessaoOrigem;
    if (!sessaoId) return;
    this.sessaoOrigem = null;
    this.ai.vincularPagina(sessaoId, paginaId).subscribe({ error: () => undefined });
  }

  private estadoNavegacao(): Record<string, unknown> | null {
    return (
      (this.router.getCurrentNavigation()?.extras.state as Record<string, unknown> | undefined) ??
      (typeof history !== 'undefined' ? (history.state as Record<string, unknown>) : null)
    );
  }
}
