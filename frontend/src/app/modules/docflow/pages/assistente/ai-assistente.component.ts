import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';

import { TIMINGS } from '@core/config/timings';
import { BadgeComponent, ButtonComponent, CardComponent, PageHeaderComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { compactQueryParams } from '@shared/utils/query-state';
import { AiImagensDropzoneComponent } from '../../components/ai-imagens-dropzone/ai-imagens-dropzone.component';
import { AiPerguntasComponent } from '../../components/ai-perguntas/ai-perguntas.component';
import { AiPropostaPreviewComponent } from '../../components/ai-proposta-preview/ai-proposta-preview.component';
import { AiImagemAnexo } from '../../models/ai-imagem-anexo.model';
import { AiJob, AiProposta } from '../../models/ai-proposta.model';
import { AiPergunta, AiSessao } from '../../models/ai-sessao.model';
import { AiTemplateRecomendacao } from '../../models/ai-template-recomendacao.model';
import { PaginaBlueprint } from '../../models/pagina-blueprint.model';
import { PaginaTemplate } from '../../models/pagina.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AiFeatureService } from '../../services/ai-feature.service';
import { AiImagensStagingService } from '../../services/ai-imagens-staging.service';
import { PaginaBlueprintService } from '../../services/pagina-blueprint.service';
import { PaginaService } from '../../services/pagina.service';

type WizardPasso = 'brief' | 'chat' | 'revisar';

@Component({
  selector: 'app-ai-assistente',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AiPerguntasComponent,
    AiPropostaPreviewComponent,
    AiImagensDropzoneComponent,
  ],
  templateUrl: './ai-assistente.component.html',
  styleUrl: './ai-assistente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistenteComponent implements OnInit, OnDestroy {
  private readonly ai = inject(AiAssistenteService);
  private readonly feature = inject(AiFeatureService);
  private readonly paginaService = inject(PaginaService);
  private readonly imagensStaging = inject(AiImagensStagingService);
  private readonly blueprintService = inject(PaginaBlueprintService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private eventosSub?: Subscription;
  private formSub?: Subscription;
  private recomendacaoSub?: Subscription;
  private pollTimer?: number;
  private geracaoResolvida = false;
  private geracaoIniciadaEm = 0;

  protected readonly sessao = signal<AiSessao | null>(null);
  protected readonly proposta = signal<AiProposta | null>(null);
  protected readonly jobGeracao = signal<AiJob | null>(null);
  protected readonly carregando = signal(false);
  protected readonly gerando = signal(false);
  protected readonly geracaoDemorada = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly respostas = signal<Record<string, string>>({});
  protected readonly imagens = signal<AiImagemAnexo[]>([]);
  protected readonly templates = signal<PaginaTemplate[]>([]);
  protected readonly blueprints = signal<PaginaBlueprint[]>([]);
  protected readonly briefingAtual = signal('');
  protected readonly templateIdAtual = signal('');
  protected readonly recomendacaoTemplate = signal<AiTemplateRecomendacao | null>(null);
  protected readonly recomendandoTemplate = signal(false);
  protected readonly aiDisponivel = this.feature.disponivel;
  protected readonly featureReady = this.feature.ready;

  protected readonly form = this.fb.nonNullable.group({
    briefing: ['', [Validators.required, Validators.minLength(40), Validators.maxLength(50_000)]],
    templateId: [''],
  });

  protected readonly briefingTamanho = computed(() => this.briefingAtual().trim().length);

  protected readonly briefingValido = computed(() => {
    const tamanho = this.briefingTamanho();
    return tamanho >= 40 && tamanho <= 50_000;
  });

  protected readonly templateSelecionado = computed(() => {
    const id = this.templateIdAtual();
    return this.templates().find(t => t.id === id) ?? null;
  });

  /** Prévia do modelo que o backend tende a escolher com o briefing atual. */
  protected readonly templateSugerido = computed(() => {
    if (this.templateIdAtual()) return null;
    return this.recomendacaoTemplate()?.recomendado ?? null;
  });

  protected readonly blueprintSugerido = computed(() => {
    const codigo = this.templateSelecionado()?.codigo ?? this.templateSugerido()?.codigo;
    return this.buscarBlueprint(codigo);
  });

  protected readonly exigeConfirmacaoTemplate = computed(
    () => !this.templateIdAtual() && this.recomendacaoTemplate()?.exigeConfirmacao === true,
  );

  protected readonly podeIniciar = computed(
    () =>
      this.briefingValido() &&
      this.aiDisponivel() &&
      !this.carregando() &&
      !this.recomendandoTemplate() &&
      !this.exigeConfirmacaoTemplate(),
  );

  protected readonly modeloUsado = computed(() => {
    const id = this.proposta()?.templateId ?? this.sessao()?.templateId;
    if (!id) return null;
    return this.templates().find(t => t.id === id) ?? null;
  });

  protected readonly blueprintUsado = computed(() => this.buscarBlueprint(this.modeloUsado()?.codigo));

  protected readonly perguntasPendentes = computed<AiPergunta[]>(() => {
    const s = this.sessao();
    if (!s || s.status !== 'AGUARDANDO_USUARIO') return [];
    const ultima = [...s.mensagens].reverse().find(m => m.papel === 'ASSISTENTE');
    return ultima?.perguntas ?? [];
  });

  protected readonly prontaParaGerar = computed(
    () => this.sessao()?.status === 'PRONTA_PARA_GERAR' || this.sessao()?.status === 'ERRO',
  );

  protected readonly pronta = computed(() => this.sessao()?.status === 'PRONTA');

  protected readonly progressoGeracao = computed(() => this.jobGeracao()?.progresso ?? 0);

  protected readonly etapaGeracao = computed(() => {
    const etapa = this.jobGeracao()?.etapa ?? 'AGUARDANDO';
    const rotulos: Record<AiJob['etapa'], string> = {
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
    return rotulos[etapa];
  });

  protected readonly passoAtual = computed<WizardPasso>(() => {
    if (!this.sessao()) return 'brief';
    if (this.proposta() || this.pronta() || this.gerando()) return 'revisar';
    return 'chat';
  });

  protected readonly passos = [
    { id: 'brief' as const, label: 'Briefing', num: 1 },
    { id: 'chat' as const, label: 'Chat', num: 2 },
    { id: 'revisar' as const, label: 'Revisar', num: 3 },
  ];

  ngOnInit(): void {
    this.feature.ensureLoaded();
    const qp = this.route.snapshot.queryParamMap;
    const templateIdQp = qp.get('templateId') ?? '';
    if (templateIdQp) {
      this.form.controls.templateId.setValue(templateIdQp);
      this.templateIdAtual.set(templateIdQp);
    }
    this.formSub = this.form.valueChanges.subscribe(v => {
      this.briefingAtual.set(v.briefing ?? '');
      this.templateIdAtual.set(v.templateId ?? '');
    });
    this.recomendacaoSub = this.form.valueChanges
      .pipe(
        debounceTime(450),
        distinctUntilChanged(
          (anterior, atual) =>
            anterior.briefing === atual.briefing && anterior.templateId === atual.templateId,
        ),
        switchMap(valor => {
          const texto = valor.briefing?.trim() ?? '';
          if (texto.length < 20 || valor.templateId) {
            this.recomendacaoTemplate.set(null);
            return of(null);
          }
          this.recomendandoTemplate.set(true);
          return this.ai
            .recomendarTemplate({
              briefing: texto,
              projetoId: qp.get('projetoId'),
              clienteId: qp.get('clienteId'),
            })
            .pipe(
              catchError(() => of(null)),
              finalize(() => this.recomendandoTemplate.set(false)),
            );
        }),
      )
      .subscribe(recomendacao => this.recomendacaoTemplate.set(recomendacao));
    this.paginaService
      .templatesPagina({
        projetoId: qp.get('projetoId') ?? undefined,
        somenteContexto: false,
      })
      .subscribe({
        next: lista => this.templates.set(lista.filter(t => t.ativo !== false)),
        error: () => {
          /* picker opcional — backend identifica o modelo pelo briefing */
        },
      });
    this.blueprintService.listar().subscribe({
      next: lista => this.blueprints.set(lista.filter(blueprint => blueprint.status === 'PUBLICADO')),
      error: () => {
        /* metadado explicativo opcional — a geração continua no backend */
      },
    });
    const sessaoId = qp.get('sessaoId');
    if (sessaoId) {
      this.retomarSessao(sessaoId);
    }
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
    this.recomendacaoSub?.unsubscribe();
    this.limparEscutaGeracao();
    this.limparImagens();
  }

  protected setImagens(imagens: AiImagemAnexo[]): void {
    this.imagens.set(imagens);
  }

  protected setErroImagem(msg: string | null): void {
    if (msg) this.erro.set(msg);
  }

  protected rotuloStatus(status: string): string {
    const map: Record<string, string> = {
      AGUARDANDO_USUARIO: 'Aguardando respostas',
      PRONTA_PARA_GERAR: 'Pronta para gerar',
      GERANDO: 'Gerando',
      PRONTA: 'Pronta',
      ERRO: 'Erro',
      CANCELADA: 'Cancelada',
    };
    return map[status] ?? status;
  }

  protected rotuloPapel(papel: string): string {
    if (papel === 'USUARIO') return 'Você';
    if (papel === 'ASSISTENTE') return 'Assistente';
    return papel;
  }

  protected passoEstado(id: WizardPasso): 'active' | 'done' | 'todo' {
    const ordem: WizardPasso[] = ['brief', 'chat', 'revisar'];
    const atual = ordem.indexOf(this.passoAtual());
    const idx = ordem.indexOf(id);
    if (idx === atual) return 'active';
    if (idx < atual) return 'done';
    return 'todo';
  }

  protected iniciar(): void {
    if (!this.briefingValido() || this.form.invalid || this.exigeConfirmacaoTemplate()) {
      this.form.markAllAsTouched();
      if (!this.briefingValido()) {
        this.erro.set('Informe um briefing com no mínimo 40 e no máximo 50.000 caracteres úteis.');
      } else if (this.exigeConfirmacaoTemplate()) {
        this.erro.set('Confirme um dos modelos sugeridos ou escolha outro modelo em Avançado.');
      }
      return;
    }
    this.carregando.set(true);
    this.erro.set(null);
    this.proposta.set(null);
    const qp = this.route.snapshot.queryParamMap;
    this.ai
      .criarSessao({
        objetivo: 'CRIAR_PAGINA',
        briefing: this.briefingComImagens(),
        projetoId: qp.get('projetoId'),
        moduloId: qp.get('moduloId'),
        templateId: this.form.controls.templateId.value || qp.get('templateId'),
      })
      .subscribe({
        next: s => {
          this.atualizarSessao(s);
          this.persistirSessaoNaUrl(s.id);
          this.respostas.set({});
          this.carregando.set(false);
        },
        error: err => {
          this.erro.set(this.mensagemErro(err));
          this.carregando.set(false);
        },
      });
  }

  protected selecionarTemplateRecomendado(templateId: string): void {
    this.form.controls.templateId.setValue(templateId);
    this.erro.set(null);
  }

  protected resumoBlueprint(blueprint: PaginaBlueprint): string {
    const base = blueprint.secoes.filter(secao => secao.necessidade !== 'OPCIONAL').length;
    const opcionais = blueprint.secoes.length - base;
    const rotuloBase = base === 1 ? 'componente-base' : 'componentes-base';
    const rotuloOpcionais = opcionais === 1 ? 'opcional' : 'opcionais';
    return `${base} ${rotuloBase}${opcionais ? ` · ${opcionais} ${rotuloOpcionais} conforme o conteúdo` : ''}`;
  }

  protected setResposta(id: string, valor: string): void {
    this.respostas.update(atual => ({ ...atual, [id]: valor }));
  }

  protected enviarRespostas(): void {
    const s = this.sessao();
    if (!s) return;

    const pendentes = this.perguntasPendentes();
    const faltando = pendentes.filter(p => p.obrigatoria && !this.respostas()[p.id]?.trim());
    if (faltando.length) {
      this.erro.set(`Responda: ${faltando.map(p => p.texto).join(' · ')}`);
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);
    this.ai
      .enviarMensagem(s.id, {
        conteudo: 'Respostas do formulário de triagem.',
        respostas: this.respostas(),
      })
      .subscribe({
        next: atualizada => {
          this.sessao.set(atualizada);
          this.respostas.set({});
          this.carregando.set(false);
        },
        error: err => {
          this.erro.set(this.mensagemErro(err));
          this.carregando.set(false);
        },
      });
  }

  protected gerarRascunho(): void {
    const s = this.sessao();
    if (!s) return;
    this.limparEscutaGeracao();
    this.geracaoResolvida = false;
    this.geracaoIniciadaEm = Date.now();
    this.geracaoDemorada.set(false);
    this.gerando.set(true);
    this.erro.set(null);
    this.proposta.set(null);
    this.jobGeracao.set(null);
    this.ai.gerar(s.id).subscribe({
      next: job => {
        this.jobGeracao.set(job);
        this.geracaoIniciadaEm = this.inicioJob(job);
        this.ouvirGeracao(s.id);
      },
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.gerando.set(false);
        this.finalizarAcompanhamento();
      },
    });
  }

  protected aplicarNoEditor(): void {
    const s = this.sessao();
    if (!s) return;
    this.carregando.set(true);
    const qp = this.route.snapshot.queryParamMap;
    this.ai
      .aplicar(s.id, {
        modo: 'FORM',
        moduloId: qp.get('moduloId') || s.moduloId,
        parentId: qp.get('parentId'),
      })
      .subscribe({
        next: app => {
          this.carregando.set(false);
          this.imagensStaging.stash(this.imagens().map(i => i.file));
          void this.router.navigate(['/doc-flow/paginas/novo'], {
            queryParams: compactQueryParams({
              projetoId: qp.get('projetoId') || s.projetoId,
              moduloId: app.moduloId || qp.get('moduloId') || s.moduloId,
              parentId: qp.get('parentId'),
            }),
            state: {
              origem: 'ai',
              proposta: {
                titulo: app.titulo,
                slug: app.slug,
                codigoTela: app.codigoTela,
                resumo: app.resumo,
                conteudoHtml: app.conteudoHtml,
                templateOrigemId: app.templateOrigemId,
                templateOrigemVersao: app.templateOrigemVersao,
                moduloId: app.moduloId,
              },
            },
          });
        },
        error: err => {
          this.erro.set(this.mensagemErro(err));
          this.carregando.set(false);
        },
      });
  }

  protected cancelar(): void {
    const s = this.sessao();
    if (!s) {
      this.limparImagens();
      this.imagensStaging.clear();
      void this.router.navigate(['/doc-flow/paginas']);
      return;
    }
    this.carregando.set(true);
    this.ai.cancelarSessao(s.id).subscribe({
      next: () => {
        this.carregando.set(false);
        this.limparImagens();
        this.imagensStaging.clear();
        void this.router.navigate(['/doc-flow/paginas']);
      },
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.carregando.set(false);
      },
    });
  }

  protected reiniciar(): void {
    this.finalizarAcompanhamento();
    this.sessao.set(null);
    this.proposta.set(null);
    this.jobGeracao.set(null);
    this.respostas.set({});
    this.erro.set(null);
    this.gerando.set(false);
    this.limparImagens();
    this.imagensStaging.clear();
    const templateId = this.form.controls.templateId.value;
    this.form.reset({ briefing: '', templateId });
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sessaoId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private retomarSessao(sessaoId: string): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.ai.buscarSessao(sessaoId).subscribe({
      next: s => {
        this.atualizarSessao(s);
        this.form.controls.briefing.setValue(s.briefing, { emitEvent: false });
        this.form.controls.templateId.setValue(s.templateId ?? '', { emitEvent: false });
        this.briefingAtual.set(s.briefing);
        this.templateIdAtual.set(s.templateId ?? '');
        this.carregando.set(false);
        if (s.status === 'GERANDO') {
          this.geracaoResolvida = false;
          this.gerando.set(true);
          this.geracaoIniciadaEm = this.inicioJob(s.jobAtual);
          this.geracaoDemorada.set(Date.now() - this.geracaoIniciadaEm >= TIMINGS.aiGenerationExpectedMs);
          this.ouvirGeracao(s.id);
          return;
        }
        if (s.status === 'PRONTA') {
          this.carregarProposta(s.id);
          return;
        }
        if (s.status === 'ERRO') {
          this.erro.set(this.mensagemFalhaJob(s.jobAtual));
        }
      },
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.carregando.set(false);
        this.persistirSessaoNaUrl(null);
      },
    });
  }

  private carregarProposta(sessaoId: string): void {
    this.carregando.set(true);
    this.ai.proposta(sessaoId).subscribe({
      next: proposta => {
        this.proposta.set(proposta);
        this.carregando.set(false);
      },
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.carregando.set(false);
      },
    });
  }

  private atualizarSessao(sessao: AiSessao): void {
    this.sessao.set(sessao);
    if (sessao.jobAtual) {
      this.jobGeracao.set(sessao.jobAtual);
    }
  }

  private persistirSessaoNaUrl(sessaoId: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sessaoId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private inicioJob(job: AiJob | null): number {
    if (!job?.startedAt) return Date.now();
    const inicio = Date.parse(job.startedAt);
    return Number.isFinite(inicio) ? inicio : Date.now();
  }

  private mensagemFalhaJob(job: AiJob | null): string {
    const mensagem = job?.erroMensagem ?? 'Falha na geração do rascunho. Você pode tentar novamente.';
    return job?.diagnosticoId ? `${mensagem} Diagnóstico: ${job.diagnosticoId}.` : mensagem;
  }

  private briefingComImagens(): string {
    const base = this.form.controls.briefing.value.trim();
    const imgs = this.imagens();
    if (!imgs.length) return base;
    const lista = imgs.map(i => `- ${i.nome}`).join('\n');
    return (
      `${base}\n\n` +
      `Imagens anexadas para o manual (inserir no HTML ao aplicar no editor; ` +
      `use placeholders screen-placeholder referenciando estes nomes):\n${lista}`
    );
  }

  private limparImagens(): void {
    for (const img of this.imagens()) {
      URL.revokeObjectURL(img.previewUrl);
    }
    this.imagens.set([]);
  }

  private buscarBlueprint(codigo?: string | null): PaginaBlueprint | null {
    if (!codigo) return null;
    return this.blueprints().find(blueprint => blueprint.templatesCompativeis.includes(codigo)) ?? null;
  }

  private ouvirGeracao(sessaoId: string): void {
    this.eventosSub = this.ai.eventosAi().subscribe({
      next: ev => {
        if (ev.sessaoId !== sessaoId) return;
        this.jobGeracao.update(atual =>
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
          this.finalizarAcompanhamento();
          return;
        }
        if (ev.status === 'SUCESSO' || ev.status === 'ERRO') {
          this.resolverGeracao(sessaoId, ev.status === 'ERRO');
        }
      },
      error: () => {
        /* polling cobre o fallback */
      },
    });
    this.pollProposta(sessaoId);
  }

  private pollProposta(sessaoId: string): void {
    if (this.geracaoResolvida) return;
    const decorrido = Date.now() - this.geracaoIniciadaEm;
    if (decorrido >= TIMINGS.aiGenerationExpectedMs) {
      this.geracaoDemorada.set(true);
    }
    this.ai.buscarSessao(sessaoId).subscribe({
      next: s => {
        if (this.geracaoResolvida) return;
        this.atualizarSessao(s);
        if (s.status === 'PRONTA') {
          this.resolverGeracao(sessaoId, false);
          return;
        }
        if (s.status === 'ERRO') {
          this.resolverGeracao(sessaoId, true);
          return;
        }
        if (s.status === 'CANCELADA') {
          this.gerando.set(false);
          this.finalizarAcompanhamento();
          return;
        }
        this.agendarProximoPoll(sessaoId);
      },
      error: () => {
        if (this.geracaoResolvida) return;
        this.agendarProximoPoll(sessaoId, true);
      },
    });
  }

  private agendarProximoPoll(sessaoId: string, aposFalha = false): void {
    const decorrido = Date.now() - this.geracaoIniciadaEm;
    const intervalo =
      aposFalha || decorrido >= TIMINGS.aiGenerationExpectedMs
        ? TIMINGS.aiGenerationSlowPollIntervalMs
        : TIMINGS.aiGenerationPollIntervalMs;
    this.pollTimer = window.setTimeout(() => this.pollProposta(sessaoId), intervalo);
  }

  private resolverGeracao(sessaoId: string, comErro: boolean): void {
    if (this.geracaoResolvida) return;
    this.geracaoResolvida = true;
    this.limparEscutaGeracao();
    if (comErro) {
      this.gerando.set(false);
      this.finalizarAcompanhamento();
      this.ai.buscarSessao(sessaoId).subscribe(s => {
        this.atualizarSessao(s);
        this.erro.set(this.mensagemFalhaJob(s.jobAtual));
      });
      return;
    }
    this.ai.proposta(sessaoId).subscribe({
      next: p => {
        this.proposta.set(p);
        this.gerando.set(false);
        this.finalizarAcompanhamento();
        this.ai.buscarSessao(sessaoId).subscribe(s => this.atualizarSessao(s));
      },
      error: err => {
        this.erro.set(this.mensagemErro(err));
        this.gerando.set(false);
        this.finalizarAcompanhamento();
      },
    });
  }

  private limparEscutaGeracao(): void {
    this.eventosSub?.unsubscribe();
    this.eventosSub = undefined;
    if (this.pollTimer !== undefined) {
      window.clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private finalizarAcompanhamento(): void {
    this.limparEscutaGeracao();
    this.geracaoIniciadaEm = 0;
    this.geracaoDemorada.set(false);
  }

  private mensagemErro(err: unknown): string {
    return mensagemErroHttp(err, 'Falha ao falar com o assistente.');
  }
}
