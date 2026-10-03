import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';

import { ButtonComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { AiAplicacao, AiPatchOperacao, AiProposta } from '../../models/ai-proposta.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import {
  AiGeracaoAcompanhamento,
  AiGeracaoCallbacks,
} from '../../pages/assistente/ai-geracao-acompanhamento';
import { AiGeracaoStatusComponent } from '../../pages/assistente/ai-geracao-status.component';
import { DiffToken, diffPalavras } from '../../utils/diff.util';
import { extrairSecoesPagina } from '../pagina-section-organizer/pagina-section-organizer.component';

type Etapa = 'pedido' | 'gerando' | 'revisao';

/**
 * "Ajustar com IA" no editor (Fase B, docs/doc-flow/13): o autor descreve o ajuste, a IA propõe
 * mudanças pontuais e o autor escolhe quais aplicar. O resultado volta para o editor; quem salva é
 * o autor, pelo fluxo normal.
 */
@Component({
  selector: 'app-ai-ajuste-painel',
  standalone: true,
  imports: [ButtonComponent, LucideAngularModule, AiGeracaoStatusComponent],
  providers: [AiGeracaoAcompanhamento],
  templateUrl: './ai-ajuste-painel.component.html',
  styleUrl: './ai-ajuste-painel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAjustePainelComponent {
  private readonly ai = inject(AiAssistenteService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly geracao = inject(AiGeracaoAcompanhamento);

  readonly paginaId = input.required<string>();
  readonly version = input.required<number>();
  /** HTML salvo da página — o mesmo que o back usa para montar o esboço. */
  readonly html = input.required<string>();

  readonly aplicado = output<AiAplicacao>();
  readonly fechado = output<void>();

  protected readonly instrucao = signal('');
  protected readonly secaoId = signal('');
  protected readonly refinamento = signal('');
  protected readonly motivoRejeicao = signal('');
  protected readonly confirmandoRejeicao = signal(false);
  protected readonly sessaoId = signal<string | null>(null);
  protected readonly proposta = signal<AiProposta | null>(null);
  protected readonly selecionadas = signal<ReadonlySet<string>>(new Set());
  protected readonly diffs = signal<Partial<Record<string, DiffToken[]>>>({});
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  /** A página mudou desde a proposta: só resta gerar de novo sobre a versão atual. */
  protected readonly versaoObsoleta = signal(false);

  /** Mesmas seções do organizador do editor; os ids batem com o esboço do back (s1, s2…). */
  protected readonly secoes = computed(() =>
    extrairSecoesPagina(this.html()).map((secao, indice) => ({
      id: `s${indice + 1}`,
      rotulo: `${indice + 1}. ${secao.titulo || secao.tipo}`,
    })),
  );

  protected readonly etapa = computed<Etapa>(() => {
    if (this.geracao.gerando()) return 'gerando';
    if (this.proposta()) return 'revisao';
    return 'pedido';
  });

  protected readonly operacoes = computed(() => this.proposta()?.operacoes ?? []);
  protected readonly avisos = computed(() => this.proposta()?.avisosGeracao ?? []);
  protected readonly pendente = computed(() => this.proposta()?.status === 'PENDENTE');
  protected readonly podePedir = computed(() => this.instrucao().trim().length >= 10 && !this.enviando());
  protected readonly previa = computed<SafeHtml | null>(() => {
    const html = this.proposta()?.conteudoHtml;
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
  });

  private readonly aoAcompanhar: AiGeracaoCallbacks = {
    sessaoAtualizada: () => undefined,
    concluida: proposta => this.receberProposta(proposta),
    falhou: mensagem => this.erro.set(mensagem),
  };

  constructor() {
    // Diff palavra a palavra de cada alteração de texto; a lib de diff carrega sob demanda.
    effect(() => {
      const alteracoes = this.operacoes().filter(op => op.tipo === 'ALTERAR_TEXTO');
      void Promise.all(
        alteracoes.map(
          async op => [op.id, await diffPalavras(op.textoAntes ?? '', op.novoTexto ?? '')] as const,
        ),
      )
        .then(pares => this.diffs.set(Object.fromEntries(pares)))
        // Sem a lib de diff, o template mostra antes/depois sem destaque por palavra.
        .catch(() => this.diffs.set({}));
    });
  }

  protected pedir(): void {
    if (!this.podePedir()) return;
    this.erro.set(null);
    this.versaoObsoleta.set(false);
    this.enviando.set(true);
    this.ai
      .pedirAjuste(this.paginaId(), {
        instrucao: this.instrucao().trim(),
        secaoId: this.secaoId() || null,
        version: this.version(),
      })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: resposta => {
          this.sessaoId.set(resposta.sessaoId);
          this.geracao.acompanhar(resposta.sessaoId, resposta.job, this.aoAcompanhar);
        },
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível pedir o ajuste.')),
      });
  }

  protected refinar(): void {
    const sessaoId = this.sessaoId();
    const texto = this.refinamento().trim();
    if (!sessaoId || !texto) return;
    this.erro.set(null);
    this.proposta.set(null);
    this.refinamento.set('');
    this.geracao.gerar(sessaoId, texto, this.aoAcompanhar);
  }

  protected alternar(operacao: AiPatchOperacao, marcada: boolean): void {
    this.selecionadas.update(atual => {
      const proxima = new Set(atual);
      if (marcada) proxima.add(operacao.id);
      else proxima.delete(operacao.id);
      return proxima;
    });
  }

  protected aplicar(): void {
    const sessaoId = this.sessaoId();
    if (!sessaoId || !this.selecionadas().size) return;
    this.erro.set(null);
    this.enviando.set(true);
    this.ai
      .aplicar(sessaoId, { modo: 'FORM', operacoesAceitas: [...this.selecionadas()] })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: aplicacao => this.aplicado.emit(aplicacao),
        error: err => {
          if (err instanceof HttpErrorResponse && err.status === 409) this.versaoObsoleta.set(true);
          this.erro.set(mensagemErroHttp(err, 'Não foi possível aplicar o ajuste.'));
        },
      });
  }

  protected rejeitar(): void {
    const sessaoId = this.sessaoId();
    if (!sessaoId) return;
    this.enviando.set(true);
    this.ai
      .rejeitarProposta(sessaoId, this.motivoRejeicao().trim() || null)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => this.recomecar(),
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível rejeitar a proposta.')),
      });
  }

  /** Volta ao pedido, mantendo a instrução para o autor ajustar e gerar de novo. */
  protected recomecar(): void {
    this.geracao.resetar();
    this.sessaoId.set(null);
    this.proposta.set(null);
    this.selecionadas.set(new Set());
    this.confirmandoRejeicao.set(false);
    this.motivoRejeicao.set('');
    this.versaoObsoleta.set(false);
  }

  protected rotuloTipo(operacao: AiPatchOperacao): string {
    if (operacao.tipo === 'INSERIR_BLOCO') return `Inserir bloco após ${operacao.aposSecaoId}`;
    if (operacao.tipo === 'REMOVER_UNIDADE') return 'Remover trecho';
    if (operacao.unidadeId === 'titulo') return 'Alterar título';
    if (operacao.unidadeId === 'resumo') return 'Alterar resumo';
    return 'Alterar texto';
  }

  protected textosInseridos(operacao: AiPatchOperacao): string[] {
    return Object.values(operacao.textos ?? {});
  }

  /** Remoções começam desmarcadas: o autor opta por elas (decisão D4). */
  private receberProposta(proposta: AiProposta): void {
    this.proposta.set(proposta);
    this.selecionadas.set(
      new Set((proposta.operacoes ?? []).filter(op => op.tipo !== 'REMOVER_UNIDADE').map(op => op.id)),
    );
  }
}
