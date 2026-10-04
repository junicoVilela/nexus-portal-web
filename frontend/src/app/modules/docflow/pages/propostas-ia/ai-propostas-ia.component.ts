import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { finalize, interval, Observable, switchMap } from 'rxjs';

import { AuthService } from '@core/auth/services/auth.service';
import {
  BadgeComponent,
  BadgeTone,
  ButtonComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { compactQueryParams } from '@shared/utils/query-state';
import {
  AiProposta,
  AiRejeicao,
  CATEGORIAS_REJEICAO,
  AiCategoriaRejeicao,
} from '../../models/ai-proposta.model';
import { AiFilaOrigem, AiFilaPrItem } from '../../models/ai-fila-pr.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiPropostaPreviewComponent } from '../../components/ai-proposta-preview/ai-proposta-preview.component';

/** Enquanto houver geração em andamento, a fila se atualiza sozinha. */
const ATUALIZACAO_MS = 5_000;

type Situacao = 'gerando' | 'nova' | 'ajuste' | 'aguardando' | 'revisar' | 'erro' | 'ignorado' | 'resolvida';
type FiltroOrigem = 'TODAS' | AiFilaOrigem;

/**
 * Propostas da IA a partir de PRs mergeados (Fase C, `docs/ai/GITHUB-WEBHOOK.md`). Ao agir num
 * item o usuário o assume: a sessão da IA passa a ser dele e o editor/assistente funcionam como
 * sempre.
 */
@Component({
  selector: 'app-ai-propostas-ia',
  standalone: true,
  imports: [
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    BadgeComponent,
    LucideAngularModule,
    DatePipe,
    RouterLink,
    AiPropostaPreviewComponent,
  ],
  templateUrl: './ai-propostas-ia.component.html',
  styleUrl: './ai-propostas-ia.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPropostasIaComponent implements OnInit {
  private readonly ai = inject(AiAssistenteService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly somentePendentes = signal(true);
  protected readonly itens = signal<AiFilaPrItem[]>([]);
  protected readonly selecionadoId = signal<string | null>(null);
  protected readonly carregando = signal(false);
  protected readonly executando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly categoriaAjuste = signal<AiCategoriaRejeicao | null>(null);
  protected readonly categorias = CATEGORIAS_REJEICAO;

  protected readonly podeAplicar = computed(() => this.auth.tem()('PAGINA:AI_APLICAR'));
  protected readonly podeCriar = computed(() => this.auth.tem()('PAGINA:CRIAR') && this.podeAplicar());

  /** INT-303: PR do GitHub ou release do Release Orchestrator. */
  protected readonly origem = signal<FiltroOrigem>('TODAS');
  protected readonly visiveis = computed(() =>
    this.origem() === 'TODAS' ? this.itens() : this.itens().filter(item => item.origem === this.origem()),
  );

  protected readonly selecionado = computed<AiFilaPrItem | null>(
    () => this.visiveis().find(item => item.id === this.selecionadoId()) ?? this.visiveis().at(0) ?? null,
  );

  ngOnInit(): void {
    this.carregar();
    interval(ATUALIZACAO_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.itens().some(item => this.situacao(item) === 'gerando') && !this.executando()) {
          this.carregar(true);
        }
      });
  }

  protected alternarFiltro(pendentes: boolean): void {
    if (pendentes === this.somentePendentes()) return;
    this.somentePendentes.set(pendentes);
    this.carregar();
  }

  protected situacao(item: AiFilaPrItem): Situacao {
    if (item.status === 'IGNORADO') return 'ignorado';
    if (item.status === 'ERRO') return 'erro';
    if (item.status === 'AGUARDANDO_RASCUNHO') return 'aguardando';
    if (item.status === 'PARA_REVISAR') return 'revisar';
    if (item.status === 'RECEBIDO' || item.sessaoStatus === 'GERANDO' || !item.proposta) return 'gerando';
    if (item.proposta.status !== 'PENDENTE') return 'resolvida';
    return item.proposta.tipo === 'ATUALIZACAO' ? 'ajuste' : 'nova';
  }

  protected rotuloSituacao(item: AiFilaPrItem): { texto: string; tom: BadgeTone } {
    switch (this.situacao(item)) {
      case 'gerando':
        return { texto: 'Gerando', tom: 'info' };
      case 'nova':
        return { texto: 'Página nova', tom: 'accent' };
      case 'ajuste':
        return { texto: 'Ajuste', tom: 'accent' };
      case 'aguardando':
        return { texto: 'Aguardando rascunho', tom: 'warn' };
      case 'revisar':
        return { texto: 'Para revisar', tom: 'warn' };
      case 'erro':
        return { texto: 'Erro', tom: 'danger' };
      case 'ignorado':
        return { texto: 'Ignorado', tom: 'neutral' };
      default:
        return { texto: this.rotuloDecisao(item.proposta), tom: 'success' };
    }
  }

  /** Página nova: leva a proposta ao editor para revisar antes de salvar. */
  protected abrirPaginaNovaNoEditor(item: AiFilaPrItem): void {
    const sessaoId = item.sessaoId;
    if (!sessaoId) return;
    this.agir(
      this.ai.assumirItemFila(item.id).pipe(switchMap(() => this.ai.aplicar(sessaoId, { modo: 'FORM' }))),
      aplicacao => {
        void this.router.navigate(['/doc-flow/paginas/novo'], {
          // O editor deduz o projeto pelo módulo da proposta.
          queryParams: compactQueryParams({ moduloId: aplicacao.moduloId }),
          state: {
            origem: 'ai',
            proposta: {
              sessaoId,
              titulo: aplicacao.titulo,
              slug: aplicacao.slug,
              codigoTela: aplicacao.codigoTela,
              resumo: aplicacao.resumo,
              conteudoHtml: aplicacao.conteudoHtml,
              templateOrigemId: aplicacao.templateOrigemId,
              templateOrigemVersao: aplicacao.templateOrigemVersao,
              moduloId: aplicacao.moduloId,
            },
          },
        });
      },
      'Não foi possível abrir a proposta no editor.',
    );
  }

  protected aceitarComoRascunho(item: AiFilaPrItem): void {
    this.agir(
      this.ai.aceitarItemFila(item.id),
      aplicacao => {
        this.toast.success('Rascunho criado a partir do PR.');
        if (aplicacao.paginaId)
          void this.router.navigate(['/doc-flow/paginas', aplicacao.paginaId, 'editar']);
      },
      'Não foi possível criar o rascunho.',
    );
  }

  /** Ajuste: abre o editor da página com o painel "Ajustar com IA" já na revisão. */
  protected abrirAjusteNoEditor(item: AiFilaPrItem): void {
    if (!item.paginaId || !item.sessaoId) return;
    const { paginaId, sessaoId } = item;
    this.agir(
      this.ai.assumirItemFila(item.id),
      () =>
        void this.router.navigate(['/doc-flow/paginas', paginaId, 'editar'], {
          queryParams: { ajuste: sessaoId },
        }),
      'Não foi possível assumir o item.',
    );
  }

  protected regenerar(item: AiFilaPrItem, instrucao: string | null): void {
    const sessaoId = item.sessaoId;
    if (!sessaoId) return;
    this.agir(
      this.ai.assumirItemFila(item.id).pipe(switchMap(() => this.ai.gerar(sessaoId, instrucao))),
      () => this.carregar(true),
      'Não foi possível gerar de novo.',
    );
  }

  protected rejeitar(item: AiFilaPrItem, rejeicao: AiRejeicao): void {
    this.agir(
      this.ai.rejeitarItemFila(item.id, rejeicao),
      atualizado => {
        this.categoriaAjuste.set(null);
        this.substituir(atualizado);
        this.toast.success('Proposta rejeitada.');
      },
      'Não foi possível rejeitar a proposta.',
    );
  }

  protected dispensar(item: AiFilaPrItem): void {
    this.agir(
      this.ai.dispensarItemFila(item.id),
      atualizado => {
        this.substituir(atualizado);
        this.toast.success('Item dispensado: a página já estava certa.');
      },
      'Não foi possível dispensar o item.',
    );
  }

  /** Rótulo da lista: "org/app#42" para PR, "Portal 1.5.0 · PED-001" para release. */
  protected identificacao(item: AiFilaPrItem): string {
    return item.origem === 'RELEASE'
      ? `${item.repositorio} · ${item.codigoTela ?? ''}`
      : `${item.repositorio}#${item.numeroPr ?? ''}`;
  }

  protected reprocessar(item: AiFilaPrItem): void {
    this.agir(
      this.ai.reprocessarItemFila(item.id),
      atualizado => this.substituir(atualizado),
      'Não foi possível processar o PR de novo.',
    );
  }

  protected carregar(silencioso = false): void {
    if (!silencioso) this.carregando.set(true);
    this.ai
      .filaPr(this.somentePendentes())
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: itens => {
          this.itens.set(itens);
          if (!silencioso) this.erro.set(null);
        },
        error: err => this.erro.set(mensagemErroHttp(err, 'Não foi possível carregar a fila.')),
      });
  }

  private rotuloDecisao(proposta: AiProposta | null): string {
    if (proposta?.status === 'ACEITA') return 'Aceita';
    if (proposta?.status === 'REJEITADA') return 'Rejeitada';
    return 'Substituída';
  }

  private substituir(atualizado: AiFilaPrItem): void {
    this.itens.update(itens => itens.map(item => (item.id === atualizado.id ? atualizado : item)));
  }

  private agir<T>(acao: Observable<T>, sucesso: (valor: T) => void, falha: string): void {
    if (this.executando()) return;
    this.executando.set(true);
    this.erro.set(null);
    acao.pipe(finalize(() => this.executando.set(false))).subscribe({
      next: sucesso,
      error: err => this.erro.set(mensagemErroHttp(err, falha)),
    });
  }
}
