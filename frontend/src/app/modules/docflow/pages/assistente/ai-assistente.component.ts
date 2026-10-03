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
import { Subscription, finalize } from 'rxjs';

import { BadgeComponent, ButtonComponent, CardComponent, PageHeaderComponent } from '@shared/ui';
import { mensagemErroHttp } from '@shared/utils/http-error-message';
import { compactQueryParams } from '@shared/utils/query-state';
import { AiComponentComposerComponent } from '../../components/ai-component-composer/ai-component-composer.component';
import { AiContextoDetectadoComponent } from '../../components/ai-contexto-detectado/ai-contexto-detectado.component';
import { AiDocumentoImportacaoComponent } from '../../components/ai-documento-importacao/ai-documento-importacao.component';
import { AiImagensDropzoneComponent } from '../../components/ai-imagens-dropzone/ai-imagens-dropzone.component';
import { AiPerguntasComponent } from '../../components/ai-perguntas/ai-perguntas.component';
import { AiPropostaPreviewComponent } from '../../components/ai-proposta-preview/ai-proposta-preview.component';
import { AiPaginaDocumentoSelecionada } from '../../models/ai-documento-importacao.model';
import { AiImagemAnexo } from '../../models/ai-imagem-anexo.model';
import { AiProposta, AiRejeicao } from '../../models/ai-proposta.model';
import { AiPergunta, AiSessao } from '../../models/ai-sessao.model';
import { BlocoPagina } from '../../components/pagina-block-library';
import { PaginaBlueprint } from '../../models/pagina-blueprint.model';
import { PaginaTemplate } from '../../models/pagina.model';
import { AiAssistenteService } from '../../services/ai-assistente.service';
import { AuthService } from '@core/auth/services/auth.service';
import { AiFeatureService } from '../../services/ai-feature.service';
import { AiImagensStagingService } from '../../services/ai-imagens-staging.service';
import { PaginaBlueprintService } from '../../services/pagina-blueprint.service';
import { PaginaBlocoService } from '../../services/pagina-bloco.service';
import { PaginaService } from '../../services/pagina.service';
import { AiGeracaoAcompanhamento, AiGeracaoCallbacks, mensagemFalhaJob } from './ai-geracao-acompanhamento';
import { AiGeracaoStatusComponent } from './ai-geracao-status.component';
import { AiRecomendacaoModelo } from './ai-recomendacao-modelo';

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
    AiContextoDetectadoComponent,
    AiPropostaPreviewComponent,
    AiImagensDropzoneComponent,
    AiDocumentoImportacaoComponent,
    AiComponentComposerComponent,
    AiGeracaoStatusComponent,
  ],
  providers: [AiGeracaoAcompanhamento, AiRecomendacaoModelo],
  templateUrl: './ai-assistente.component.html',
  styleUrl: './ai-assistente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistenteComponent implements OnInit, OnDestroy {
  private readonly ai = inject(AiAssistenteService);
  private readonly auth = inject(AuthService);
  private readonly feature = inject(AiFeatureService);
  private readonly paginaService = inject(PaginaService);
  private readonly imagensStaging = inject(AiImagensStagingService);
  private readonly blueprintService = inject(PaginaBlueprintService);
  private readonly blocoService = inject(PaginaBlocoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly geracao = inject(AiGeracaoAcompanhamento);
  private readonly recomendacao = inject(AiRecomendacaoModelo);
  private formSub?: Subscription;
  private recomendacaoSub?: Subscription;

  protected readonly sessao = signal<AiSessao | null>(null);
  protected readonly proposta = signal<AiProposta | null>(null);
  protected readonly carregando = signal(false);
  protected readonly rejeitando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly respostas = signal<Record<string, string>>({});
  protected readonly imagens = signal<AiImagemAnexo[]>([]);
  protected readonly templates = signal<PaginaTemplate[]>([]);
  protected readonly blueprints = signal<PaginaBlueprint[]>([]);
  protected readonly blocosCatalogo = signal<BlocoPagina[]>([]);
  protected readonly briefingAtual = signal('');
  protected readonly templateIdAtual = signal('');

  // Estado da geração e da recomendação vive nas peças extraídas; aliases para o template.
  protected readonly gerando = this.geracao.gerando;
  protected readonly recomendacaoTemplate = this.recomendacao.recomendacao;
  protected readonly recomendandoTemplate = this.recomendacao.carregando;
  protected readonly componentesSelecionados = this.recomendacao.componentesSelecionados;
  protected readonly composicaoValida = this.recomendacao.composicaoValida;

  private readonly paginaImportadaContexto = signal<{
    importacaoId: string;
    paginaPlanoId: string;
    projetoId: string;
    moduloId: string;
    clienteId: string | null;
  } | null>(null);
  protected readonly aiDisponivel = this.feature.disponivel;
  protected readonly featureReady = this.feature.ready;
  protected readonly contextoImportacao = {
    projetoId: this.route.snapshot.queryParamMap.get('projetoId'),
    clienteId: this.route.snapshot.queryParamMap.get('clienteId'),
  };
  /**
   * Importação ativa. Precisa ser reativa: o passo 1 é recriado ao voltar dos passos 2/3 e,
   * lido só uma vez da URL, perderia a importação feita depois de abrir a tela.
   */
  protected readonly importacaoIdAtual = signal<string | null>(
    this.route.snapshot.queryParamMap.get('importacaoId'),
  );

  protected readonly form = this.fb.nonNullable.group({
    briefing: ['', [Validators.required, Validators.minLength(40), Validators.maxLength(50_000)]],
    templateId: [''],
  });

  /** Ler e gerar fica com `PAGINA:AI_GERAR`; levar ao editor exige `PAGINA:AI_APLICAR`. */
  protected readonly podeAplicar = computed(() => this.auth.tem()('PAGINA:AI_APLICAR'));
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
      !this.exigeConfirmacaoTemplate() &&
      this.composicaoValida(),
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

  /** O que a última triagem entendeu do briefing, para o autor confirmar ou corrigir. */
  protected readonly contextoDetectado = computed<Record<string, string>>(() => {
    const mensagens = this.sessao()?.mensagens ?? [];
    const ultima = [...mensagens].reverse().find(m => m.papel === 'ASSISTENTE');
    return ultima?.contexto ?? {};
  });

  protected readonly prontaParaGerar = computed(
    () => this.sessao()?.status === 'PRONTA_PARA_GERAR' || this.sessao()?.status === 'ERRO',
  );

  protected readonly pronta = computed(() => this.sessao()?.status === 'PRONTA');

  protected readonly passoAtual = computed<WizardPasso>(() => {
    if (!this.sessao()) return 'brief';
    if (this.proposta() || this.pronta() || this.gerando()) return 'revisar';
    return 'chat';
  });

  protected readonly passos = [
    { id: 'brief' as const, label: 'Preparar', num: 1 },
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
    this.recomendacaoSub = this.recomendacao.observar(this.form.valueChanges, () => {
      const contextoImportado = this.paginaImportadaContexto();
      return {
        projetoId: contextoImportado?.projetoId ?? qp.get('projetoId'),
        clienteId: contextoImportado ? contextoImportado.clienteId : qp.get('clienteId'),
      };
    });
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
    this.blocoService.listar().subscribe({
      next: blocos => this.blocosCatalogo.set(blocos),
      error: () => {
        /* nomes dos componentes na revisão são um complemento; a geração continua no backend */
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
    if (
      !this.briefingValido() ||
      this.form.invalid ||
      this.exigeConfirmacaoTemplate() ||
      !this.composicaoValida()
    ) {
      this.form.markAllAsTouched();
      if (!this.briefingValido()) {
        this.erro.set('Informe um briefing com no mínimo 40 e no máximo 50.000 caracteres úteis.');
      } else if (this.exigeConfirmacaoTemplate()) {
        this.erro.set('Confirme um dos modelos sugeridos ou escolha outro modelo em Avançado.');
      } else if (!this.composicaoValida()) {
        this.erro.set('Mantenha os blocos essenciais e selecione pelo menos três componentes.');
      }
      return;
    }
    this.carregando.set(true);
    this.erro.set(null);
    this.proposta.set(null);
    const qp = this.route.snapshot.queryParamMap;
    const contextoImportado = this.paginaImportadaContexto();
    this.ai
      .criarSessao({
        objetivo: 'CRIAR_PAGINA',
        briefing: this.briefingComImagens(),
        projetoId: contextoImportado?.projetoId ?? qp.get('projetoId'),
        moduloId: contextoImportado?.moduloId ?? qp.get('moduloId'),
        clienteId: contextoImportado ? contextoImportado.clienteId : qp.get('clienteId'),
        templateId: this.form.controls.templateId.value || qp.get('templateId'),
        componentesSelecionados: this.componentesSelecionados().length
          ? this.componentesSelecionados()
          : undefined,
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

  protected atualizarComponentesSelecionados(ids: string[]): void {
    this.recomendacao.selecionar(ids);
    this.erro.set(null);
  }

  protected usarPaginaImportada(pagina: AiPaginaDocumentoSelecionada): void {
    this.importacaoIdAtual.set(pagina.importacaoId);
    this.paginaImportadaContexto.set({
      importacaoId: pagina.importacaoId,
      paginaPlanoId: pagina.id,
      projetoId: pagina.projetoId,
      moduloId: pagina.moduloId,
      clienteId: pagina.clienteId,
    });
    this.recomendacao.usarComponentesImportados(pagina.componentesSelecionados ?? []);
    this.form.patchValue({
      briefing: pagina.briefing,
      templateId: pagina.templateId ?? '',
    });
    this.erro.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: compactQueryParams({
        importacaoId: pagina.importacaoId,
        projetoId: pagina.projetoId,
        moduloId: pagina.moduloId,
        clienteId: pagina.clienteId,
        paginaPlanoId: pagina.id,
      }),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    window.setTimeout(() => document.getElementById('briefing')?.focus());
  }

  /** Volta ao documento importado, mantendo a importação; a sessão atual fica para trás. */
  protected voltarAoDocumento(): void {
    this.reiniciar();
  }

  protected persistirImportacaoNaUrl(importacaoId: string): void {
    this.importacaoIdAtual.set(importacaoId);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { importacaoId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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

  /** Correção do contexto detectado vira resposta da sessão e refaz a triagem. */
  protected corrigirContexto(respostas: Record<string, string>): void {
    const s = this.sessao();
    if (!s) return;
    this.carregando.set(true);
    this.erro.set(null);
    this.ai
      .enviarMensagem(s.id, { conteudo: 'Contexto corrigido pelo autor.', respostas })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: atualizada => this.sessao.set(atualizada),
        error: err => this.erro.set(this.mensagemErro(err)),
      });
  }

  protected rejeitarProposta(rejeicao: AiRejeicao): void {
    const s = this.sessao();
    if (!s) return;
    this.rejeitando.set(true);
    this.erro.set(null);
    this.ai
      .rejeitarProposta(s.id, rejeicao)
      .pipe(finalize(() => this.rejeitando.set(false)))
      .subscribe({
        next: proposta => this.proposta.set(proposta),
        error: err => this.erro.set(this.mensagemErro(err)),
      });
  }

  /** `instrucao`: ajuste pedido pelo autor sobre a proposta atual; `null` só tenta de novo. */
  protected gerarRascunho(instrucao: string | null = null): void {
    const s = this.sessao();
    if (!s) return;
    this.erro.set(null);
    this.proposta.set(null);
    this.geracao.gerar(s.id, instrucao, this.aoAcompanharGeracao);
  }

  protected aplicarNoEditor(): void {
    const s = this.sessao();
    if (!s) return;
    this.carregando.set(true);
    const qp = this.route.snapshot.queryParamMap;
    const contextoImportado = this.paginaImportadaContexto();
    this.ai
      .aplicar(s.id, {
        modo: 'FORM',
        moduloId: contextoImportado?.moduloId || qp.get('moduloId') || s.moduloId,
        parentId: qp.get('parentId'),
      })
      .subscribe({
        next: app => {
          this.carregando.set(false);
          this.imagensStaging.stash(this.imagens().map(i => i.file));
          void this.router.navigate(['/doc-flow/paginas/novo'], {
            queryParams: compactQueryParams({
              projetoId: contextoImportado?.projetoId || qp.get('projetoId') || s.projetoId,
              moduloId: app.moduloId || contextoImportado?.moduloId || qp.get('moduloId') || s.moduloId,
              parentId: qp.get('parentId'),
              importacaoId: contextoImportado?.importacaoId || qp.get('importacaoId'),
              paginaPlanoId: contextoImportado?.paginaPlanoId || qp.get('paginaPlanoId'),
            }),
            state: {
              origem: 'ai',
              proposta: {
                sessaoId: s.id,
                titulo: app.titulo,
                slug: app.slug,
                codigoTela: app.codigoTela,
                resumo: app.resumo,
                conteudoHtml: app.conteudoHtml,
                templateOrigemId: app.templateOrigemId,
                templateOrigemVersao: app.templateOrigemVersao,
                moduloId: app.moduloId,
                importacaoId: contextoImportado?.importacaoId || qp.get('importacaoId'),
                paginaPlanoId: contextoImportado?.paginaPlanoId || qp.get('paginaPlanoId'),
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
    this.geracao.resetar();
    this.sessao.set(null);
    this.proposta.set(null);
    this.respostas.set({});
    this.recomendacao.selecionar([]);
    this.erro.set(null);
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
        this.componentesSelecionados.set(s.componentesSelecionados ?? []);
        this.carregando.set(false);
        if (s.status === 'GERANDO') {
          this.geracao.retomar(s, this.aoAcompanharGeracao);
          return;
        }
        if (s.status === 'PRONTA') {
          this.carregarProposta(s.id);
          return;
        }
        if (s.status === 'ERRO') {
          this.erro.set(mensagemFalhaJob(s.jobAtual));
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

  private readonly aoAcompanharGeracao: AiGeracaoCallbacks = {
    sessaoAtualizada: sessao => this.sessao.set(sessao),
    concluida: proposta => this.proposta.set(proposta),
    falhou: mensagem => this.erro.set(mensagem),
  };

  private atualizarSessao(sessao: AiSessao): void {
    this.sessao.set(sessao);
    this.geracao.sincronizarJob(sessao.jobAtual);
  }

  private persistirSessaoNaUrl(sessaoId: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sessaoId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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

  private mensagemErro(err: unknown): string {
    return mensagemErroHttp(err, 'Falha ao falar com o assistente.');
  }
}
