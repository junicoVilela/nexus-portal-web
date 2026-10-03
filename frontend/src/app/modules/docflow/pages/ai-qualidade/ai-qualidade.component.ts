import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe, PercentPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { EmptyStateComponent, KpiCardComponent, PageHeaderComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { AiMetricas } from '../../models/ai-metricas.model';
import { rotuloCategoriaRejeicao } from '../../models/ai-proposta.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';

const ROTULOS_OPERACAO: Record<string, string> = {
  ALTERAR_TEXTO: 'Alterar texto',
  INSERIR_BLOCO: 'Inserir bloco',
  REMOVER_UNIDADE: 'Remover trecho',
};

/**
 * Qualidade da IA: diz se uma mudança de prompt melhorou ou piorou. Compara a taxa de aceite por
 * `prompt_versao` (ver `ai/src/main/resources/prompts`), mostra avisos de fallback, motivos de
 * rejeição, aceite parcial dos ajustes de página, latência e tokens.
 */
@Component({
  selector: 'app-ai-qualidade',
  standalone: true,
  imports: [PageHeaderComponent, KpiCardComponent, EmptyStateComponent, DecimalPipe, DatePipe, PercentPipe],
  templateUrl: './ai-qualidade.component.html',
  styleUrl: './ai-qualidade.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiQualidadeComponent implements OnInit {
  private readonly ai = inject(AiAssistenteService);

  protected readonly periodos = [7, 30, 90] as const;
  protected readonly dias = signal<number>(30);
  protected readonly metricas = signal<AiMetricas | null>(null);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);

  /** Aceite geral: mesma regra do back (decididas = aceitas + rejeitadas + regeneradas). */
  protected readonly taxaAceiteGeral = computed(() => {
    const prompts = this.metricas()?.porPrompt ?? [];
    const aceitas = prompts.reduce((soma, p) => soma + p.aceitas, 0);
    const decididas = prompts.reduce((soma, p) => soma + p.aceitas + p.rejeitadas + p.regeneradas, 0);
    return decididas ? aceitas / decididas : null;
  });

  /** Barras proporcionais à categoria mais citada; vazio quando ninguém escolheu categoria. */
  protected readonly categoriasRejeicao = computed(() => {
    const categorias = this.metricas()?.rejeicoesPorCategoria ?? [];
    const maior = Math.max(0, ...categorias.map(c => c.total));
    return maior === 0 ? [] : categorias.map(c => ({ ...c, largura: (c.total / maior) * 100 }));
  });

  protected readonly alteracoes = computed(() => {
    const a = this.metricas()?.alteracoesPosAceite;
    if (!a?.amostras) return [];
    return [
      { rotulo: 'Título', total: a.tituloAlterado },
      { rotulo: 'Código da tela', total: a.codigoTelaAlterado },
      { rotulo: 'Resumo', total: a.resumoAlterado },
      { rotulo: 'Conteúdo reescrito (mais da metade)', total: a.conteudoReescrito },
    ].map(item => ({ ...item, fracao: item.total / a.amostras }));
  });

  protected readonly vazio = computed(() => {
    const m = this.metricas();
    return !!m && m.geracao.jobs === 0 && m.porPrompt.length === 0;
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected selecionarPeriodo(dias: number): void {
    if (dias === this.dias()) return;
    this.dias.set(dias);
    this.carregar();
  }

  protected rotuloCategoria(categoria: string | null): string | null {
    return rotuloCategoriaRejeicao(categoria);
  }

  protected rotuloOperacao(tipo: string): string {
    return ROTULOS_OPERACAO[tipo] ?? tipo;
  }

  protected percentual(taxa: number | null): string {
    return taxa === null ? '—' : `${Math.round(taxa * 100)}%`;
  }

  protected milhares(valor: number): string {
    return valor.toLocaleString('pt-BR');
  }

  protected segundos(ms: number | null): string {
    return ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`;
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.ai
      .metricas(this.dias())
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: metricas => this.metricas.set(metricas),
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível carregar as métricas da IA.')),
      });
  }
}
