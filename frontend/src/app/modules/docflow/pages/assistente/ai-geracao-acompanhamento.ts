import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { TIMINGS } from '@core/config/timings';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { AiJob, AiProposta } from '../../models/ai-proposta.model';
import { AiSessao } from '../../models/ai-sessao.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';

/** Como o wizard reage ao andamento da geração. */
export interface AiGeracaoCallbacks {
  /** Sessão recarregada durante o acompanhamento (status, mensagens, jobAtual). */
  sessaoAtualizada(sessao: AiSessao): void;
  concluida(proposta: AiProposta): void;
  falhou(mensagem: string): void;
}

const ROTULOS_ETAPA: Record<AiJob['etapa'], string> = {
  AGUARDANDO: 'Aguardando início',
  PREPARANDO_CONTEXTO: 'Analisando o briefing',
  SELECIONANDO_ESTRUTURA: 'Escolhendo blueprint e componentes',
  GERANDO_CONTEUDO: 'Gerando o conteúdo da página',
  VALIDANDO_QUALIDADE: 'Validando qualidade e consistência',
  FINALIZANDO: 'Preparando a proposta para revisão',
  CONCLUIDA: 'Rascunho concluído',
  CANCELADA: 'Geração cancelada',
  FALHA: 'Falha na geração',
};

/**
 * Acompanha um job de geração do assistente: SSE como canal principal e polling da sessão como
 * contingência (intervalo maior depois do tempo esperado ou de falha). Não há timeout no
 * navegador — o backend expira jobs sem heartbeat.
 *
 * Escopo do componente (`providers` do wizard): o acompanhamento para ao sair da tela.
 */
@Injectable()
export class AiGeracaoAcompanhamento implements OnDestroy {
  private readonly ai = inject(AiAssistenteService);

  readonly job = signal<AiJob | null>(null);
  readonly gerando = signal(false);
  /** Passou do tempo esperado; a UI tranquiliza o autor em vez de sugerir nova tentativa. */
  readonly demorada = signal(false);
  readonly progresso = computed(() => this.job()?.progresso ?? 0);
  readonly etapa = computed(() => ROTULOS_ETAPA[this.job()?.etapa ?? 'AGUARDANDO']);

  private eventosSub?: Subscription;
  private pollTimer?: number;
  private resolvida = false;
  private iniciadaEm = 0;

  ngOnDestroy(): void {
    this.limparEscuta();
  }

  /** Mantém o job exibido em dia quando a sessão é carregada por fora do acompanhamento. */
  sincronizarJob(job: AiJob | null): void {
    if (job) this.job.set(job);
  }

  /** Enfileira a geração (com instrução opcional de ajuste) e passa a acompanhá-la. */
  gerar(sessaoId: string, instrucao: string | null, callbacks: AiGeracaoCallbacks): void {
    this.limparEscuta();
    this.resolvida = false;
    this.iniciadaEm = Date.now();
    this.demorada.set(false);
    this.gerando.set(true);
    this.job.set(null);
    this.ai.gerar(sessaoId, instrucao).subscribe({
      next: job => {
        this.job.set(job);
        this.iniciadaEm = inicioJob(job);
        this.ouvir(sessaoId, callbacks);
      },
      error: err => {
        this.gerando.set(false);
        this.finalizar();
        callbacks.falhou(mensagemErro(err));
      },
    });
  }

  /** Reabre o acompanhamento de uma sessão que já estava `GERANDO` (ex.: F5 durante a geração). */
  retomar(sessao: AiSessao, callbacks: AiGeracaoCallbacks): void {
    this.resolvida = false;
    this.gerando.set(true);
    this.sincronizarJob(sessao.jobAtual);
    this.iniciadaEm = inicioJob(sessao.jobAtual);
    this.demorada.set(Date.now() - this.iniciadaEm >= TIMINGS.aiGenerationExpectedMs);
    this.ouvir(sessao.id, callbacks);
  }

  /** Para de acompanhar e zera o estado (nova sessão). */
  resetar(): void {
    this.finalizar();
    this.job.set(null);
    this.gerando.set(false);
  }

  private ouvir(sessaoId: string, callbacks: AiGeracaoCallbacks): void {
    this.eventosSub = this.ai.eventosAi().subscribe({
      next: ev => {
        if (ev.sessaoId !== sessaoId) return;
        this.job.update(atual =>
          atual && atual.id === ev.jobId
            ? {
                ...atual,
                status: ev.status,
                etapa: ev.etapa,
                progresso: ev.progresso,
                tentativa: ev.tentativa,
                diagnosticoId: ev.diagnosticoId ?? atual.diagnosticoId,
              }
            : atual,
        );
        if (ev.status === 'CANCELADO') {
          this.gerando.set(false);
          this.finalizar();
          return;
        }
        if (ev.status === 'SUCESSO' || ev.status === 'ERRO') {
          this.resolver(sessaoId, ev.status === 'ERRO', callbacks);
        }
      },
      error: () => {
        /* polling cobre o fallback */
      },
    });
    this.poll(sessaoId, callbacks);
  }

  private poll(sessaoId: string, callbacks: AiGeracaoCallbacks): void {
    if (this.resolvida) return;
    if (Date.now() - this.iniciadaEm >= TIMINGS.aiGenerationExpectedMs) {
      this.demorada.set(true);
    }
    this.ai.buscarSessao(sessaoId).subscribe({
      next: s => {
        if (this.resolvida) return;
        callbacks.sessaoAtualizada(s);
        this.sincronizarJob(s.jobAtual);
        if (s.status === 'PRONTA') {
          this.resolver(sessaoId, false, callbacks);
          return;
        }
        if (s.status === 'ERRO') {
          this.resolver(sessaoId, true, callbacks);
          return;
        }
        if (s.status === 'CANCELADA') {
          this.gerando.set(false);
          this.finalizar();
          return;
        }
        this.agendarPoll(sessaoId, callbacks);
      },
      error: () => {
        if (this.resolvida) return;
        this.agendarPoll(sessaoId, callbacks, true);
      },
    });
  }

  private agendarPoll(sessaoId: string, callbacks: AiGeracaoCallbacks, aposFalha = false): void {
    const decorrido = Date.now() - this.iniciadaEm;
    const intervalo =
      aposFalha || decorrido >= TIMINGS.aiGenerationExpectedMs
        ? TIMINGS.aiGenerationSlowPollIntervalMs
        : TIMINGS.aiGenerationPollIntervalMs;
    this.pollTimer = window.setTimeout(() => this.poll(sessaoId, callbacks), intervalo);
  }

  /** SSE e polling podem chegar juntos: só o primeiro desfecho conta. */
  private resolver(sessaoId: string, comErro: boolean, callbacks: AiGeracaoCallbacks): void {
    if (this.resolvida) return;
    this.resolvida = true;
    this.limparEscuta();
    if (comErro) {
      this.gerando.set(false);
      this.finalizar();
      this.ai.buscarSessao(sessaoId).subscribe(s => {
        callbacks.sessaoAtualizada(s);
        this.sincronizarJob(s.jobAtual);
        callbacks.falhou(mensagemFalhaJob(s.jobAtual));
      });
      return;
    }
    this.ai.proposta(sessaoId).subscribe({
      next: proposta => {
        callbacks.concluida(proposta);
        this.gerando.set(false);
        this.finalizar();
        this.ai.buscarSessao(sessaoId).subscribe(s => {
          callbacks.sessaoAtualizada(s);
          this.sincronizarJob(s.jobAtual);
        });
      },
      error: err => {
        this.gerando.set(false);
        this.finalizar();
        callbacks.falhou(mensagemErro(err));
      },
    });
  }

  private limparEscuta(): void {
    this.eventosSub?.unsubscribe();
    this.eventosSub = undefined;
    if (this.pollTimer !== undefined) {
      window.clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private finalizar(): void {
    this.limparEscuta();
    this.iniciadaEm = 0;
    this.demorada.set(false);
  }
}

/** Mensagem de falha do job com o diagnóstico para correlação nos logs. */
export function mensagemFalhaJob(job: AiJob | null): string {
  const mensagem = job?.erroMensagem ?? 'Falha na geração do rascunho. Você pode tentar novamente.';
  return job?.diagnosticoId ? `${mensagem} Diagnóstico: ${job.diagnosticoId}.` : mensagem;
}

function inicioJob(job: AiJob | null): number {
  if (!job?.startedAt) return Date.now();
  const inicio = Date.parse(job.startedAt);
  return Number.isFinite(inicio) ? inicio : Date.now();
}

function mensagemErro(err: unknown): string {
  return mensagemErroHttp(err, 'Falha ao falar com o assistente.');
}
