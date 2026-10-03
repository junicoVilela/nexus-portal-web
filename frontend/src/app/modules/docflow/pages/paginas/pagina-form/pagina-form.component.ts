import { DatePipe, DecimalPipe, KeyValuePipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, firstValueFrom, forkJoin, of, Subject } from 'rxjs';
import { debounceTime, startWith, takeUntil } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TIMINGS } from '@core/config/timings';
import { AuthService } from '@core/auth/services/auth.service';
import { CanDeactivateComponent } from '@shared/guards';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { ClienteService } from '@modules/docflow/services/cliente.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Modulo } from '@modules/docflow/models/modulo.model';
import {
  Pagina,
  PaginaAnexo,
  PaginaQualidadeItem,
  PaginaTemplate,
} from '@modules/docflow/models/pagina.model';
import { Projeto } from '@modules/docflow/models/projeto.model';
import { Cliente } from '@modules/docflow/models/cliente.model';
import { compactQueryParams, parseSortDirection } from '@shared/utils/query-state';
import {
  PageHeaderComponent,
  ButtonComponent,
  ConfirmService,
  SkeletonComponent,
  ToastService,
} from '@shared/ui';
import { PaginaRichEditorComponent } from '@modules/docflow/components/pagina-rich-editor';
import {
  adicionarColunaHtml,
  adicionarLinhaHtml,
  compactarCelulasTabelaHtml,
  decorarTabelasNoDom,
  contagemTabelasHtml,
  removerColunaHtml,
  removerUltimaLinhaHtml,
} from '@modules/docflow/components/pagina-rich-editor/pagina-table-html';
import { PaginaRevisoesComponent } from '@modules/docflow/components/pagina-revisoes';
import { PaginaAnexosComponent } from '@modules/docflow/components/pagina-anexos';
import {
  AtalhoEditor,
  EditorModo,
  PaginaEditorToolbarComponent,
} from '@modules/docflow/components/pagina-editor-toolbar';
import { PaginaMetaFieldsComponent } from '@modules/docflow/components/pagina-meta-fields';
import { PaginaTemplatePickerComponent } from '@modules/docflow/components/pagina-template-picker';
import { PaginaStatusBadgeComponent } from '@modules/docflow/components/pagina-status-badge';
import { BlocoPagina, PaginaBlockLibraryComponent } from '@modules/docflow/components/pagina-block-library';
import {
  PaginaSecaoVisual,
  PaginaSectionOrganizerComponent,
} from '@modules/docflow/components/pagina-section-organizer';
import { PaginaTemplateSaveComponent } from '@modules/docflow/components/pagina-template-save';
import {
  PaginaCreationProgressComponent,
  PaginaCreationStep,
  PaginaCreationStepId,
} from '@modules/docflow/components/pagina-creation-progress/pagina-creation-progress.component';
import { avaliarQualidadePagina } from '@modules/docflow/utils/pagina-quality.util';
import {
  contarItensIndiceGuias,
  montarSecaoGuiasDisponiveis,
  sincronizarIndicePai,
  substituirOuAdicionarSecaoGuias,
} from '@modules/docflow/utils/pagina-indice.util';
import {
  aplicarPlaceholdersConteudo,
  ContextoPlaceholdersPagina,
} from '@modules/docflow/utils/pagina-placeholders.util';
import { PaginaDraftService } from '@modules/docflow/services/pagina-draft.service';
import { PaginaBlocoService } from '@modules/docflow/services/pagina-bloco.service';
import { AiAssistenteService } from '@modules/docflow/services/ai-assistente.service';
import { AiFeatureService } from '@modules/docflow/services/ai-feature.service';
import { AiAjustePainelComponent } from '../../../components/ai-ajuste-painel/ai-ajuste-painel.component';
import { AiAplicacao } from '../../../models/ai-proposta.model';
import { PaginaFormModelos } from './pagina-form-modelos';
import { PaginaFormIa } from './pagina-form-ia';
import { PaginaFormRevisoes } from './pagina-form-revisoes';

type SalvarDestino = 'lista' | 'continuar' | 'nova';
type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict' | 'error';

@Component({
  selector: 'app-pagina-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    KeyValuePipe,
    LucideAngularModule,
    PageHeaderComponent,
    ButtonComponent,
    SkeletonComponent,
    PaginaRichEditorComponent,
    PaginaRevisoesComponent,
    PaginaAnexosComponent,
    PaginaEditorToolbarComponent,
    PaginaMetaFieldsComponent,
    PaginaTemplatePickerComponent,
    PaginaStatusBadgeComponent,
    PaginaBlockLibraryComponent,
    PaginaSectionOrganizerComponent,
    PaginaTemplateSaveComponent,
    PaginaCreationProgressComponent,
    AiAjustePainelComponent,
  ],
  templateUrl: './pagina-form.component.html',
  styleUrl: './pagina-form.component.css',
  providers: [PaginaFormModelos, PaginaFormRevisoes, PaginaFormIa],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaFormComponent implements OnInit, AfterViewChecked, OnDestroy, CanDeactivateComponent {
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly paginaDraftService = inject(PaginaDraftService);
  private readonly aiAssistenteService = inject(AiAssistenteService);
  private readonly aiFeature = inject(AiFeatureService);
  protected readonly modelos = inject(PaginaFormModelos);
  protected readonly historico = inject(PaginaFormRevisoes);
  private readonly ia = inject(PaginaFormIa);
  private tabelasDecoradasAssinatura = '';

  @ViewChild('conteudoHtmlInput') conteudoHtmlInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fotoInput') fotoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('previewBody') previewBody?: ElementRef<HTMLElement>;
  @ViewChild(PaginaRichEditorComponent) richEditor?: PaginaRichEditorComponent;
  @ViewChild(PaginaBlockLibraryComponent) blockLibrary?: PaginaBlockLibraryComponent;
  @ViewChild(PaginaSectionOrganizerComponent) sectionOrganizer?: PaginaSectionOrganizerComponent;

  private readonly destroy$ = new Subject<void>();
  private dirty = false;
  private justSaved = false;
  private autosavePendente = false;

  // ───── Signals: estado reativo ─────
  protected readonly projetos = signal<Projeto[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly todosModulos = signal<Modulo[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly paginas = signal<Pagina[]>([]);
  protected readonly anexos = signal<PaginaAnexo[]>([]);
  protected readonly paginaAtual = signal<Pagina | undefined>(undefined);
  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly saving = signal(false);
  protected readonly editorModo = signal<EditorModo>('rico');
  protected readonly rascunhoSalvoEm = signal<Date | null>(null);
  protected readonly blocosCatalogo = signal<BlocoPagina[]>([]);
  protected readonly catalogoBlocosIndisponivel = signal(false);
  // Estado dos modelos vive em PaginaFormModelos; aliases para o código e o template do editor.
  protected readonly templates = this.modelos.templates;
  protected readonly templateSelecionadoId = this.modelos.templateSelecionadoId;
  protected readonly templateOrigemId = this.modelos.templateOrigemId;
  protected readonly templateOrigemVersao = this.modelos.templateOrigemVersao;
  protected readonly mostrarTemplates = this.modelos.mostrarTemplates;
  // Histórico de revisões vive em PaginaFormRevisoes; aliases para o código e o template.
  protected readonly revisoes = this.historico.revisoes;
  protected readonly totalRevisoes = this.historico.totalRevisoes;
  protected readonly revisoesPage = this.historico.revisoesPage;
  protected readonly revisoesPageSize = this.historico.revisoesPageSize;
  protected readonly revisoesSort = this.historico.revisoesSort;
  protected readonly revisoesDir = this.historico.revisoesDir;
  protected readonly showDiff = this.historico.showDiff;
  protected readonly autosaveStatus = signal<AutosaveStatus>('idle');
  protected readonly autosaveServidorEm = signal<Date | null>(null);
  protected readonly conflitoMensagem = signal<string | null>(null);
  protected readonly previewing = signal(false);
  protected readonly organizandoSecoes = signal(false);
  protected readonly etapaAtiva = signal<PaginaCreationStepId>('modelo');
  protected readonly podeCriarTemplate = computed(() => this.auth.tem()('PAGINA:CRIAR'));
  protected readonly podeEditarTemplate = computed(() => this.auth.tem()('PAGINA:EDITAR'));
  protected readonly podeEditarPagina = computed(() => this.auth.tem()('PAGINA:EDITAR'));

  /** "Ajustar com IA" (Fase B): só em página salva, editável e com o módulo de IA ligado. */
  protected readonly painelAjusteAberto = this.ia.painelAjusteAberto;
  protected readonly podeAjustarComIa = computed(() => {
    const pagina = this.paginaAtual();
    return (
      !!this.editId() &&
      !!pagina &&
      pagina.status !== 'ARQUIVADO' &&
      !this.conteudoTravado() &&
      this.podeEditarPagina() &&
      this.aiFeature.disponivel()
    );
  });

  /**
   * Aprovada ou publicada: o conteúdo só muda depois de voltar para rascunho (o back recusa com
   * 422). O pacote publica o conteúdo atual das páginas publicadas.
   */
  protected readonly conteudoTravado = computed(() => {
    const status = this.paginaAtual()?.status;
    return status === 'APROVADO' || status === 'PUBLICADO';
  });
  protected readonly podeExcluirTemplate = computed(() => this.auth.tem()('PAGINA:EXCLUIR'));
  protected readonly paginaDeImportacao =
    !!this.route.snapshot.queryParamMap.get('importacaoId') &&
    !!this.route.snapshot.queryParamMap.get('paginaPlanoId');
  protected readonly temFilhosPagina = computed(() => {
    const id = this.editId();
    if (!id) return false;
    return this.paginas().some(pagina => pagina.parentId === id);
  });
  readonly atalhosEstrutura: AtalhoEditor[] = [
    { label: 'H1', action: () => this.inserirHtml('<h1>Título principal</h1>') },
    { label: 'H2', action: () => this.inserirHtml('<h2>Seção</h2>') },
    { label: 'P', action: () => this.inserirHtml('<p>Descreva o procedimento aqui.</p>') },
    {
      label: 'Lista',
      action: () => this.inserirHtml('<ul>\n <li>Primeiro passo</li>\n <li>Segundo passo</li>\n</ul>'),
    },
    {
      label: 'Tabela',
      action: () =>
        this.inserirHtml(
          '<div class="table-wrap">\n <table>\n  <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>\n  <tbody><tr><td>Nome</td><td>Informe o nome.</td></tr></tbody>\n </table>\n</div>',
        ),
    },
    { label: 'Código', action: () => this.inserirHtml('<pre><code>cole_o_exemplo_aqui();</code></pre>') },
  ];

  readonly atalhosBlocos: AtalhoEditor[] = [
    { label: 'Foto', action: () => this.abrirSeletorFotos() },
    { label: 'Dica', action: () => this.inserirDica() },
    { label: 'Atenção', action: () => this.inserirAtencao() },
    { label: 'Passo a passo', action: () => this.inserirPassoAPasso() },
    { label: 'FAQ', action: () => this.inserirFaq() },
  ];

  readonly form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    slug: [''],
    codigoTela: ['', Validators.required],
    resumo: [''],
    conteudoHtml: [''],
    ordem: [0],
    ativo: [true],
    projetoId: ['', Validators.required],
    moduloId: ['', Validators.required],
    parentId: [''],
  });
  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    requireSync: true,
  });

  // ───── Computeds derivados de signals ─────
  protected readonly paginasHierarquia = computed<Pagina[]>(() => {
    const lista = this.paginas();
    const filhos = new Map<string, Pagina[]>();
    const ids = new Set(lista.map(pagina => pagina.id));
    lista.forEach(pagina => {
      if (pagina.parentId) {
        filhos.set(pagina.parentId, [...(filhos.get(pagina.parentId) ?? []), pagina]);
      }
    });
    filhos.forEach(items => items.sort(this.compararPaginas));
    const roots = lista
      .filter(pagina => !pagina.parentId || !ids.has(pagina.parentId))
      .sort(this.compararPaginas);
    const ordenadas: Pagina[] = [];
    const append = (pagina: Pagina) => {
      ordenadas.push(pagina);
      (filhos.get(pagina.id) ?? []).forEach(append);
    };
    roots.forEach(append);
    return ordenadas;
  });

  protected readonly qualidadeItens = computed<PaginaQualidadeItem[]>(() => {
    const form = this.formValue();
    const id = this.editId();
    const filhosCount = id ? this.paginas().filter(pagina => pagina.parentId === id).length : undefined;
    const indiceItemCount = contarItensIndiceGuias(form.conteudoHtml);
    return avaliarQualidadePagina({ ...form, filhosCount, indiceItemCount });
  });

  protected readonly subtituloCabecalho = computed(() => {
    const atual = this.paginaAtual();
    if (atual) {
      return (
        'Criado por ' +
        this.nomeUsuario(atual.createdBy) +
        ' · Atualizado por ' +
        this.nomeUsuario(atual.updatedBy || atual.createdBy)
      );
    }
    const parentId = this.formValue().parentId?.trim();
    if (!parentId) return null;
    const parent = this.paginas().find(pagina => pagina.id === parentId);
    return parent ? `Subpágina de ${parent.titulo}` : 'Nova subpágina';
  });

  protected readonly qualidadeConcluidos = computed(
    () => this.qualidadeItens().filter(item => item.ok).length,
  );
  protected readonly aptoParaRevisao = computed(() =>
    this.qualidadeItens().every(item => item.severidade !== 'ERRO' || item.ok),
  );
  protected readonly etapasCriacao = computed<PaginaCreationStep[]>(() => {
    const qualidade = this.qualidadeItens();
    const ok = (codigo: string) => qualidade.find(item => item.codigo === codigo)?.ok ?? false;
    return [
      {
        id: 'modelo',
        label: 'Modelo',
        description: 'Estrutura inicial',
        complete: !this.mostrarTemplates(),
      },
      {
        id: 'contexto',
        label: 'Contexto',
        description: 'Identificação e local',
        complete: ok('TITULO') && ok('CODIGO_TELA') && ok('CONTEXTO'),
      },
      {
        id: 'conteudo',
        label: 'Conteúdo',
        description: 'Texto e imagens',
        complete: ok('CONTEUDO') && ok('PLACEHOLDERS') && ok('IMAGENS_ALT'),
      },
      {
        id: 'revisao',
        label: 'Revisão',
        description: 'Qualidade e preview',
        complete: qualidade.every(item => item.ok),
      },
    ];
  });
  protected readonly variaveisPendentes = computed(() => {
    const html = this.formValue().conteudoHtml ?? '';
    return [...html.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*}}/g)]
      .map(match => match[1])
      .filter((item, index, lista) => lista.indexOf(item) === index);
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly projetoService: ProjetoService,
    private readonly clienteService: ClienteService,
    private readonly moduloService: ModuloService,
    private readonly paginaService: PaginaService,
    private readonly paginaBlocoService: PaginaBlocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly confirmService: ConfirmService,
  ) {}

  private get draftKey(): string {
    return `docflow:pagina-form:${this.editId() ?? 'novo'}`;
  }

  ngOnInit(): void {
    this.modelos.configurar({
      projetoId: () => this.form.controls.projetoId.value || undefined,
      aplicacao: template => this.contextoAplicacaoTemplate(template),
      conteudoHtml: () => this.form.controls.conteudoHtml.value,
    });
    this.historico.configurar({
      paginaId: () => this.paginaAtual()?.id,
      estadoMudou: () => this.atualizarEstadoEditor(),
    });
    this.aiFeature.ensureLoaded();
    this.editId.set(this.route.snapshot.paramMap.get('id') ?? undefined);
    if (!this.editId() && this.ia.redirecionarSeOrigemIa()) {
      return;
    }
    this.route.queryParamMap.subscribe(params => {
      const modo = params.get('modo');
      const diff = params.get('diff');
      this.revisoesSort.set(params.get('revisaoSort') ?? 'numero');
      this.revisoesDir.set(parseSortDirection(params.get('revisaoDir'), 'DESC'));
      if (modo === 'rico' || modo === 'codigo' || modo === 'split' || modo === 'preview') {
        this.editorModo.set(modo);
      }
      this.showDiff.set(diff === '1');
    });
    forkJoin({
      projetos: this.projetoService.projetos(),
      clientes: this.clienteService.clientes(),
      modulos: this.moduloService.modulos(),
      paginas: this.paginaService.paginas(),
      pagina: this.editId() ? this.paginaService.pagina(this.editId()!) : of(undefined),
      templates: this.paginaService
        .templatesPagina({
          projetoId: this.route.snapshot.queryParamMap.get('projetoId') ?? undefined,
          somenteContexto: true,
        })
        .pipe(catchError(() => of([] as PaginaTemplate[]))),
      blocos: this.paginaBlocoService.listar().pipe(
        catchError(() => {
          this.catalogoBlocosIndisponivel.set(true);
          return of([] as BlocoPagina[]);
        }),
      ),
    }).subscribe({
      next: ({ projetos, clientes, modulos, paginas, pagina, templates, blocos }) => {
        this.projetos.set(projetos);
        this.clientes.set(clientes);
        this.todosModulos.set(modulos);
        this.paginas.set(paginas);
        this.templates.set(templates);
        this.blocosCatalogo.set(blocos);
        if (pagina) {
          this.carregarPagina(pagina);
        } else {
          this.mostrarTemplates.set(true);
          this.aplicarContextoInicial();
          this.aplicarTipoPaginaInicial();
        }
        this.modelos.carregar();
        this.restaurarRascunho();
        if (!pagina) {
          this.aplicarPropostaAiSePresente();
        }
        this.inicializarResolucaoVariaveis();
        this.inicializarAutoSave();
        if (this.rascunhoSalvoEm()) this.autosalvarServidor();
      },
      error: () => this.toast.error('Erro ao carregar dados da página.'),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasUnsavedChanges(): boolean {
    return this.dirty && !this.justSaved;
  }

  private inicializarAutoSave(): void {
    this.form.valueChanges
      .pipe(debounceTime(TIMINGS.autosaveDebounceMs), takeUntil(this.destroy$))
      .subscribe(value => {
        this.dirty = true;
        this.justSaved = false;
        this.rascunhoSalvoEm.set(this.paginaDraftService.salvar(this.draftKey, value));
        this.autosalvarServidor();
      });
  }

  private restaurarRascunho(): void {
    const snapshot = this.paginaDraftService.carregar<Record<string, unknown>>(this.draftKey, {
      maxAgeDays: TIMINGS.draftMaxAgeDays,
      servidorAtualizadoEm: this.paginaAtual()?.updatedAt,
    });
    if (!snapshot) return;

    this.form.patchValue(snapshot.value);
    this.rascunhoSalvoEm.set(snapshot.savedAt);
    this.toast.success('Rascunho local restaurado.');
  }

  private limparRascunho(key = this.draftKey): void {
    this.paginaDraftService.remover(key);
    this.dirty = false;
    this.rascunhoSalvoEm.set(null);
  }

  private autosalvarServidor(): void {
    if (this.form.invalid || this.saving() || this.autosaveStatus() === 'conflict') return;
    if (this.paginaAtual() && this.paginaAtual()!.status !== 'RASCUNHO') return;
    if (this.autosaveStatus() === 'saving') {
      this.autosavePendente = true;
      return;
    }
    const id = this.editId();
    const draftKeyAntesDoSave = this.draftKey;
    this.autosaveStatus.set('saving');
    const request = id
      ? this.paginaService.autosavePagina(id, this.payloadPagina())
      : this.paginaService.salvarPagina(this.payloadPagina());
    request.subscribe({
      next: pagina => {
        this.limparRascunho(draftKeyAntesDoSave);
        this.atualizarPaginaAposPersistencia(pagina);
        this.autosaveServidorEm.set(new Date());
        this.autosaveStatus.set('saved');
        this.executarAutosavePendente();
      },
      error: error => {
        this.tratarErroPersistencia(error, true);
        this.executarAutosavePendente();
      },
    });
  }

  private executarAutosavePendente(): void {
    if (!this.autosavePendente) return;
    this.autosavePendente = false;
    queueMicrotask(() => this.autosalvarServidor());
  }

  salvar(destino: SalvarDestino = 'lista'): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha título, código da tela, projeto e módulo.');
      return;
    }
    const draftKeyAntesDoSave = this.draftKey;
    this.saving.set(true);
    this.paginaService.salvarPagina(this.payloadPagina(), this.editId()).subscribe({
      next: pagina => {
        this.justSaved = true;
        this.limparRascunho(draftKeyAntesDoSave);
        this.saving.set(false);
        this.autosaveStatus.set('saved');
        this.autosaveServidorEm.set(new Date());
        this.conflitoMensagem.set(null);
        if (pagina.parentId) {
          sincronizarIndicePai(this.paginaService, this.toast, pagina.parentId);
        }
        this.vincularImportacaoEContinuar(pagina, destino);
      },
      error: error => {
        this.saving.set(false);
        this.tratarErroPersistencia(error, false);
      },
    });
  }

  imprimirPreview(): void {
    window.print();
  }

  async abrirPreviewFiel(): Promise<void> {
    if (this.previewing()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha os campos obrigatórios antes de abrir a prévia fiel.');
      return;
    }
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      this.toast.error('O navegador bloqueou a janela de prévia.');
      return;
    }
    previewWindow.document.write(this.previewLoadingHtml());
    previewWindow.document.close();
    this.previewing.set(true);
    try {
      const pagina = await this.persistirParaPreview();
      if (!pagina) {
        this.escreverErroPreview(previewWindow, 'Não foi possível sincronizar a página para a prévia.');
        return;
      }
      const html = await firstValueFrom(this.paginaService.previewPaginaHtml(pagina.id));
      previewWindow.document.open();
      previewWindow.document.write(html);
      previewWindow.document.close();
    } catch (error) {
      this.tratarErroPersistencia(error, false);
      this.escreverErroPreview(previewWindow, this.mensagemErro(error, 'Erro ao gerar a prévia fiel.'));
    } finally {
      this.previewing.set(false);
    }
  }

  async usarVersaoServidor(): Promise<void> {
    const id = this.editId();
    if (!id) return;
    const confirmar = await this.confirmService.confirm({
      title: 'Carregar versão do servidor?',
      message: 'As alterações locais em conflito serão descartadas.',
      acceptLabel: 'Carregar servidor',
      variant: 'danger',
      icon: 'AlertTriangle',
    });
    if (!confirmar) return;
    try {
      const pagina = await firstValueFrom(this.paginaService.pagina(id));
      this.limparRascunho();
      this.carregarPagina(pagina);
      this.conflitoMensagem.set(null);
      this.autosaveStatus.set('idle');
      this.toast.success('Versão mais recente carregada.');
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao recarregar a página.'));
    }
  }

  async sobrescreverConflito(): Promise<void> {
    const id = this.editId();
    if (!id || this.saving()) return;
    const confirmar = await this.confirmService.confirm({
      title: 'Sobrescrever a versão do servidor?',
      message: 'Suas alterações locais serão mantidas e substituirão a edição feita por outra pessoa.',
      acceptLabel: 'Sobrescrever',
      variant: 'danger',
      icon: 'AlertTriangle',
    });
    if (!confirmar) return;
    this.saving.set(true);
    try {
      const atualServidor = await firstValueFrom(this.paginaService.pagina(id));
      this.paginaAtual.set(atualServidor);
      const pagina = await firstValueFrom(this.paginaService.salvarPagina(this.payloadPagina(), id));
      this.limparRascunho();
      this.ativarPaginaSalva(pagina);
      this.conflitoMensagem.set(null);
      this.autosaveStatus.set('saved');
      this.autosaveServidorEm.set(new Date());
      this.toast.success('Sua versão foi salva no servidor.');
    } catch (error) {
      this.tratarErroPersistencia(error, false);
    } finally {
      this.saving.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected salvarPorAtalho(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === 's') {
      event.preventDefault();
      this.salvar('continuar');
      return;
    }
    if (key === 'p') {
      if (!this.podePublicarPorAtalho()) return;
      event.preventDefault();
      this.publicarPaginaEditor();
    }
  }

  private podePublicarPorAtalho(): boolean {
    const id = this.editId();
    const pagina = this.paginaAtual();
    return !!id && !!pagina && pagina.status === 'APROVADO' && !this.saving();
  }

  publicarPaginaEditor(): void {
    if (!this.podePublicarPorAtalho()) return;
    const id = this.editId()!;
    if (!this.aptoParaRevisao()) {
      this.toast.warn('Corrija os itens de qualidade antes de publicar.');
      return;
    }
    this.saving.set(true);
    this.paginaService.publicarPagina(id).subscribe({
      next: atualizada => {
        this.paginaAtual.set(atualizada);
        this.saving.set(false);
        this.toast.success('Página publicada.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao publicar página.');
      },
    });
  }

  /** O esboço da IA parte do conteúdo salvo: alterações pendentes ficariam de fora. */
  abrirAjusteIa(): void {
    if (!this.podeAjustarComIa()) return;
    if (this.hasUnsavedChanges()) {
      this.toast.warn('Salve a página antes de pedir um ajuste à IA.');
      return;
    }
    this.painelAjusteAberto.set(true);
  }

  /** Ajuste aceito no painel: entra no editor como alteração pendente; o autor revisa e salva. */
  aplicarAjusteIa(aplicacao: AiAplicacao): void {
    this.form.patchValue({
      titulo: aplicacao.titulo,
      resumo: aplicacao.resumo ?? '',
      conteudoHtml: aplicacao.conteudoHtml,
    });
    this.dirty = true;
    this.justSaved = false;
    this.form.markAsDirty();
    this.painelAjusteAberto.set(false);
    this.toast.success('Ajuste aplicado no editor. Revise e salve para registrar a revisão.');
  }

  async voltarParaRascunho(): Promise<void> {
    const id = this.editId();
    const pagina = this.paginaAtual();
    if (!id || !pagina || !this.conteudoTravado() || this.saving()) return;
    const confirmar = await this.confirmService.confirm({
      title: 'Voltar para rascunho?',
      message:
        pagina.status === 'PUBLICADO'
          ? 'A página sai das próximas publicações até ser revisada, aprovada e publicada de novo. O manual já gerado não muda.'
          : 'A aprovação é desfeita: depois de editar, a página precisa passar pela revisão de novo.',
      acceptLabel: 'Voltar para rascunho',
      variant: 'danger',
      icon: 'AlertTriangle',
    });
    if (!confirmar) return;
    this.saving.set(true);
    this.paginaService.salvarRascunho(id).subscribe({
      next: atualizada => {
        this.paginaAtual.set(atualizada);
        this.saving.set(false);
        this.toast.success('Página em rascunho. O conteúdo pode ser editado.');
      },
      error: error => {
        this.saving.set(false);
        this.toast.error(this.mensagemErro(error, 'Não foi possível voltar a página para rascunho.'));
      },
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  protected protegerSaidaDoNavegador(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedChanges()) return;
    event.preventDefault();
  }

  protected irParaEtapa(etapa: PaginaCreationStepId): void {
    this.etapaAtiva.set(etapa);
    if (etapa === 'modelo') this.mostrarTemplates.set(true);
    queueMicrotask(() => {
      document.getElementById(`pagina-${etapa}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  protected corrigirPendencia(codigo: string): void {
    const alvos: Record<string, { etapa: PaginaCreationStepId; elemento?: string }> = {
      TITULO: { etapa: 'contexto', elemento: 'pagina-titulo' },
      CODIGO_TELA: { etapa: 'contexto', elemento: 'pagina-codigo' },
      CONTEXTO: { etapa: 'contexto', elemento: 'pagina-projeto' },
      RESUMO: { etapa: 'contexto', elemento: 'pagina-resumo' },
      CONTEUDO: { etapa: 'conteudo' },
      PLACEHOLDERS: { etapa: 'conteudo' },
      IMAGENS_ALT: { etapa: 'conteudo' },
      SECOES: { etapa: 'conteudo' },
    };
    const alvo = alvos[codigo] ?? { etapa: 'revisao' as PaginaCreationStepId };
    this.pendenciaDestacada.set(codigo);
    if (codigo === 'IMAGENS_ALT' || codigo === 'IMAGENS_ORIGEM') this.destacarImagemNoCodigo(codigo);
    if (codigo === 'PLACEHOLDERS') this.destacarPlaceholderNoCodigo();
    this.irParaEtapa(alvo.etapa);
    queueMicrotask(() => document.getElementById(alvo.elemento ?? `pagina-${alvo.etapa}`)?.focus());
    window.setTimeout(() => this.pendenciaDestacada.set(null), 3600);
  }

  protected readonly pendenciaDestacada = signal<string | null>(null);

  private destacarImagemNoCodigo(codigo: 'IMAGENS_ALT' | 'IMAGENS_ORIGEM'): void {
    this.editorModo.set('codigo');
    const html = this.form.controls.conteudoHtml.value ?? '';
    const documento = new DOMParser().parseFromString(html, 'text/html');
    const imagem = Array.from(documento.querySelectorAll('img')).find(item =>
      codigo === 'IMAGENS_ALT' ? !item.getAttribute('alt')?.trim() : !item.getAttribute('src')?.trim(),
    );
    if (!imagem) return;
    const inicio = html.indexOf(imagem.outerHTML);
    if (inicio < 0) return;
    window.setTimeout(() => {
      const textarea = this.conteudoHtmlInput?.nativeElement;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(inicio, inicio + imagem.outerHTML.length);
    });
  }

  private destacarPlaceholderNoCodigo(): void {
    this.editorModo.set('codigo');
    const html = this.form.controls.conteudoHtml.value ?? '';
    const placeholder =
      /\{\{\s*[a-zA-Z0-9_.-]+\s*}}|\b(explique|descreva|informe|liste|registre aqui|nome do campo|escreva uma resposta)\b/i;
    const encontrado = html.match(placeholder);
    if (!encontrado || encontrado.index === undefined) return;
    window.setTimeout(() => {
      const textarea = this.conteudoHtmlInput?.nativeElement;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(encontrado.index!, encontrado.index! + encontrado[0].length);
    });
  }

  voltar(): void {
    this.router.navigate(docFlowRouterCommands(['paginas']));
  }

  abrirSeletorFotos(): void {
    this.fotoInput?.nativeElement.click();
  }

  onProjetoChange(): void {
    this.atualizarModulosPorProjeto(true);
    this.modelos.carregar();
    this.resolverVariaveisPendentesLocalmente();
  }

  onModuloChange(): void {
    const moduloId = this.form.controls.moduloId.value;
    const parentId = this.form.controls.parentId.value;
    if (parentId && !this.parentOptions.some(pagina => pagina.id === parentId)) {
      this.form.controls.parentId.setValue('');
    }
    if (!moduloId) {
      this.form.controls.parentId.setValue('');
    }
    this.resolverVariaveisPendentesLocalmente();
  }

  definirEditorModo(modo: EditorModo): void {
    this.editorModo.set(modo);
    this.atualizarEstadoEditor();
    this.tabelasDecoradasAssinatura = '';
  }

  executarAtalho(atalho: AtalhoEditor): void {
    atalho.action();
  }

  protected readonly temTabelaNoConteudo = computed(
    () => contagemTabelasHtml(this.formValue()?.conteudoHtml ?? '') > 0,
  );

  ngAfterViewChecked(): void {
    this.decorarTabelasPreview();
  }

  adicionarLinhaTabela(): void {
    this.alterarLinhasTabela('add');
  }

  removerLinhaTabela(): void {
    this.alterarLinhasTabela('remove');
  }

  adicionarColunaTabela(): void {
    this.alterarColunasTabela('add');
  }

  removerColunaTabela(): void {
    this.alterarColunasTabela('remove');
  }

  aoClicarAcaoTabelaPreview(event: MouseEvent): void {
    const alvo = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-table-action]');
    if (!alvo) return;
    event.preventDefault();
    const acao = alvo.dataset['tableAction'];
    const index = Number(alvo.dataset['tableIndex'] ?? '0');
    if (acao === 'add-row') this.alterarLinhasTabela('add', index);
    if (acao === 'remove-row') this.alterarLinhasTabela('remove', index);
    if (acao === 'add-col') this.alterarColunasTabela('add', index);
    if (acao === 'remove-col') this.alterarColunasTabela('remove', index);
  }

  private alterarLinhasTabela(acao: 'add' | 'remove', tableIndex = 0): void {
    this.alterarTabela('linha', acao, tableIndex);
  }

  private alterarColunasTabela(acao: 'add' | 'remove', tableIndex = 0): void {
    this.alterarTabela('coluna', acao, tableIndex);
  }

  /**
   * No modo rico, a seleção do editor decide a célula; nos demais (ou sem seleção em tabela),
   * altera a tabela {@code tableIndex} direto no HTML.
   */
  private alterarTabela(dimensao: 'linha' | 'coluna', acao: 'add' | 'remove', tableIndex: number): void {
    const atual = this.form.controls.conteudoHtml.value ?? '';
    if (contagemTabelasHtml(atual) === 0) {
      this.toast.warn(
        dimensao === 'linha'
          ? 'Inclua um dicionário/tabela no conteúdo antes de adicionar linhas.'
          : 'Inclua um dicionário/tabela no conteúdo antes de alterar colunas.',
      );
      return;
    }

    const editor = this.editorModo() === 'rico' ? this.richEditor : undefined;
    if (dimensao === 'linha' && editor?.podeAdicionar()) {
      if (acao === 'add') editor.adicionarLinhaTabela();
      else editor.removerLinhaTabela();
      return;
    }
    if (dimensao === 'coluna' && editor?.podeAdicionarColuna()) {
      if (acao === 'add') editor.adicionarColunaTabela();
      else editor.removerColunaTabela();
      return;
    }

    const operacoes = {
      linha: { add: adicionarLinhaHtml, remove: removerUltimaLinhaHtml },
      coluna: { add: adicionarColunaHtml, remove: removerColunaHtml },
    };
    const proximo = operacoes[dimensao][acao](atual, tableIndex);
    if (proximo === atual && acao === 'remove') {
      this.toast.warn(`A tabela precisa manter ao menos uma ${dimensao}.`);
      return;
    }
    this.form.controls.conteudoHtml.setValue(proximo);
    this.form.controls.conteudoHtml.markAsDirty();
    this.dirty = true;
    editor?.aplicarHtml(proximo);
    this.tabelasDecoradasAssinatura = '';
  }

  private decorarTabelasPreview(): void {
    const root = this.previewBody?.nativeElement;
    if (!root || this.editorModo() === 'codigo') return;
    const html = this.form.controls.conteudoHtml.value ?? '';
    const assinatura = `${this.editorModo()}|${html.length}|${contagemTabelasHtml(html)}`;
    if (assinatura === this.tabelasDecoradasAssinatura && root.querySelector('.pf-table-chrome')) return;

    decorarTabelasNoDom(root);
    this.tabelasDecoradasAssinatura = assinatura;
  }

  async anexarFotos(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    const paginaId = await this.garantirRascunhoParaAnexos();
    if (!paginaId) {
      input.value = '';
      return;
    }
    try {
      const snippets = await Promise.all(files.map(file => this.uploadImagem(paginaId, file)));
      this.inserirHtml(snippets.join('\n'));
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao anexar imagem.'));
    } finally {
      input.value = '';
    }
  }

  inserirHtml(snippet: string): void {
    if (this.editorModo() === 'rico' && this.richEditor) {
      this.richEditor.inserirHtml(snippet);
      return;
    }
    const control = this.form.controls.conteudoHtml;
    const textarea = this.conteudoHtmlInput?.nativeElement;
    const current = control.value ?? '';
    if (!textarea) {
      control.setValue(`${current}${current ? '\n' : ''}${snippet}`);
      return;
    }
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? start;
    const before = current.slice(0, start);
    const after = current.slice(end);
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    const suffix = after && !snippet.endsWith('\n') ? '\n' : '';
    control.setValue(`${before}${prefix}${snippet}${suffix}${after}`);
    queueMicrotask(() => {
      textarea.focus();
      const position = start + prefix.length + snippet.length;
      textarea.setSelectionRange(position, position);
    });
  }

  preservarSelecaoEditor(): void {
    this.richEditor?.guardarSelecao();
  }

  inserirBloco(bloco: BlocoPagina): void {
    const html = aplicarPlaceholdersConteudo(bloco.html, this.contextoPlaceholders());
    this.inserirHtml(html);
    this.toast.success(`Bloco "${bloco.nome}" inserido.`);
  }

  atualizarSumarioFilhos(): void {
    const id = this.editId();
    if (!id) return;
    const filhos = this.paginas()
      .filter(pagina => pagina.parentId === id)
      .sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo));
    if (!filhos.length) {
      this.toast.warn('Não há subpáginas para atualizar o índice.');
      return;
    }
    const secaoHtml = montarSecaoGuiasDisponiveis(filhos);
    const html = this.form.controls.conteudoHtml.value ?? '';
    const proximo = substituirOuAdicionarSecaoGuias(html, secaoHtml);
    this.form.controls.conteudoHtml.setValue(proximo);
    if (this.editorModo() === 'rico' && this.richEditor) {
      this.richEditor.aplicarHtml(proximo);
    }
    this.toast.success('Índice dos filhos atualizado.');
  }

  abrirBibliotecaPorAtalho(): void {
    this.richEditor?.guardarSelecao();
    this.blockLibrary?.abrirComBusca();
  }

  atalhoBlocoNoCodigo(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const textarea = event.currentTarget as HTMLTextAreaElement;
    if (textarea.selectionStart !== textarea.selectionEnd) return;
    const inicioLinha = textarea.value.lastIndexOf('\n', Math.max(0, textarea.selectionStart - 1)) + 1;
    const textoAntesDoCursor = textarea.value.slice(inicioLinha, textarea.selectionStart);
    if (textoAntesDoCursor.trim()) return;
    event.preventDefault();
    this.abrirBibliotecaPorAtalho();
  }

  alternarOrganizadorSecoes(): void {
    this.organizandoSecoes.update(organizando => !organizando);
  }

  aplicarOrdemSecoes(html: string): void {
    if (html === this.form.controls.conteudoHtml.value) return;
    if (this.autosaveStatus() === 'saved') this.autosaveStatus.set('idle');
    this.form.controls.conteudoHtml.setValue(html);
  }

  async confirmarExclusaoSecao(secao: PaginaSecaoVisual): Promise<void> {
    const confirmado = await this.confirmService.confirm({
      title: 'Excluir seção?',
      message: `A seção "${secao.titulo}" será removida do conteúdo. Você ainda poderá usar Desfazer antes de sair do editor.`,
      acceptLabel: 'Excluir seção',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;
    if (this.sectionOrganizer?.excluir(secao.id)) {
      this.toast.success(`Seção "${secao.titulo}" excluída. Use Desfazer para restaurá-la.`);
    }
  }

  inserirDica(): void {
    this.inserirHtml(
      '<div class="callout"><strong>Dica</strong><p>Registre uma orientação importante.</p></div>',
    );
  }

  inserirAtencao(): void {
    this.inserirHtml(
      '<div class="warning"><strong>Atenção</strong><p>Valide esta etapa antes de continuar.</p></div>',
    );
  }

  inserirPassoAPasso(): void {
    this.inserirHtml(
      '<section class="steps"><h2>Passo a passo</h2><ol><li>Acesse a tela.</li><li>Preencha os campos obrigatórios.</li><li>Confirme a operação.</li></ol></section>',
    );
  }

  inserirFaq(): void {
    this.inserirHtml(
      '<section class="faq"><h2>Perguntas frequentes</h2><div class="faq-list"><article class="faq-item"><h3>Quando usar esta tela?</h3><p>Descreva o cenário de uso.</p></article></div></section>',
    );
  }

  async selecionarTemplate(template: PaginaTemplate | null): Promise<void> {
    const conteudoAtual = this.form.controls.conteudoHtml.value.trim();
    if (conteudoAtual) {
      const substituir = await this.confirmService.confirm({
        title: 'Substituir conteúdo atual?',
        message: 'Ao aplicar outro modelo, o conteúdo atual do editor será substituído.',
        acceptLabel: 'Aplicar modelo',
        variant: 'danger',
        icon: 'AlertTriangle',
      });
      if (!substituir) return;
    }
    if (!template) {
      this.templateSelecionadoId.set(null);
      this.templateOrigemId.set(undefined);
      this.templateOrigemVersao.set(undefined);
      this.form.controls.conteudoHtml.setValue('');
      this.mostrarTemplates.set(false);
      this.irParaEtapa('contexto');
      return;
    }
    this.modelos.aplicandoTemplate.set(true);
    try {
      const aplicado = await this.modelos.aplicar(template);
      this.templateSelecionadoId.set(template.id);
      this.templateOrigemId.set(aplicado.templateId);
      this.templateOrigemVersao.set(aplicado.versao);
      this.form.controls.conteudoHtml.setValue(aplicado.conteudoHtml);
      this.modelos.templatePreview.set(null);
      this.mostrarTemplates.set(false);
      this.irParaEtapa('contexto');
      const pendencias = aplicado.variaveisPendentes.length;
      this.toast.success(
        pendencias
          ? `Modelo "${template.nome}" aplicado com ${pendencias} variável(is) pendente(s).`
          : `Modelo "${template.nome}" aplicado.`,
      );
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Não foi possível aplicar o modelo neste contexto.'));
    } finally {
      this.modelos.aplicandoTemplate.set(false);
    }
  }

  private contextoAplicacaoTemplate(template: PaginaTemplate) {
    return {
      projetoId: this.form.controls.projetoId.value || undefined,
      moduloId: this.form.controls.moduloId.value || undefined,
      clienteId: template.clienteId,
      titulo: this.form.controls.titulo.value || undefined,
      codigoTela: this.form.controls.codigoTela.value || undefined,
    };
  }

  private inicializarResolucaoVariaveis(): void {
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resolverVariaveisPendentesLocalmente();
    });
  }

  private resolverVariaveisPendentesLocalmente(): void {
    const html = this.form.controls.conteudoHtml.value;
    if (!html.includes('{{')) return;
    const resolvido = aplicarPlaceholdersConteudo(html, this.contextoPlaceholders());
    if (resolvido !== html) {
      this.form.controls.conteudoHtml.setValue(resolvido);
    }
  }

  private contextoPlaceholders(): ContextoPlaceholdersPagina {
    const projeto = this.projetos().find(item => item.id === this.form.controls.projetoId.value);
    const modulo = this.todosModulos().find(item => item.id === this.form.controls.moduloId.value);
    const template = this.templates().find(item => item.id === this.templateSelecionadoId());
    return {
      titulo: this.form.controls.titulo.value.trim() || null,
      codigoTela: this.form.controls.codigoTela.value.trim() || null,
      moduloNome: modulo?.nome ?? null,
      projetoNome: projeto?.nome ?? null,
      clienteNome: template?.clienteNome ?? null,
      dataAtual: new Intl.DateTimeFormat('pt-BR').format(new Date()),
    };
  }

  async excluirAnexo(anexo: PaginaAnexo): Promise<void> {
    const id = this.editId();
    if (!id) return;
    const ok = await this.confirmService.confirm({
      title: 'Remover anexo?',
      message: `O arquivo "${anexo.nomeOriginal}" será removido permanentemente desta página.`,
      acceptLabel: 'Remover',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!ok) return;
    this.paginaService.excluirAnexoPagina(id, anexo.id).subscribe({
      next: () => {
        this.anexos.update(list => list.filter(item => item.id !== anexo.id));
        this.toast.success('Anexo removido.');
      },
      error: () => this.toast.error('Erro ao remover anexo.'),
    });
  }

  anexoUrl(anexo: PaginaAnexo): string {
    return this.paginaService.downloadAnexoUrl(anexo);
  }

  get parentOptions(): Pagina[] {
    const moduloId = this.form.controls.moduloId.value;
    return this.paginasHierarquia().filter(
      pagina => pagina.id !== this.editId() && (!moduloId || pagina.moduloId === moduloId),
    );
  }

  get conteudoPreview(): string {
    const html = this.form.controls.conteudoHtml.value;
    return html?.trim() ? compactarCelulasTabelaHtml(html) : '<p>Sem conteúdo HTML cadastrado.</p>';
  }

  get moduloSelecionado(): Modulo | undefined {
    const moduloId = this.form.controls.moduloId.value;
    return this.todosModulos().find(modulo => modulo.id === moduloId);
  }

  get breadcrumbPreview(): string {
    const modulo = this.moduloSelecionado;
    if (!modulo) return 'Projeto / Módulo';
    return `${modulo.projetoNome} / ${modulo.nome}`;
  }

  get tituloPreview(): string {
    return this.form.controls.titulo.value.trim() || 'Título da página';
  }

  get resumoPreview(): string {
    return this.form.controls.resumo.value.trim();
  }

  get codigoTelaPreview(): string {
    return this.form.controls.codigoTela.value.trim() || 'CODIGO_TELA';
  }

  get totalCaracteresConteudo(): number {
    return this.form.controls.conteudoHtml.value.trim().length;
  }

  get totalLinhasConteudo(): number {
    const conteudo = this.form.controls.conteudoHtml.value;
    return conteudo ? conteudo.split('\n').length : 0;
  }

  get editorModoLabel(): string {
    switch (this.editorModo()) {
      case 'rico':
        return 'rico';
      case 'codigo':
        return 'código';
      case 'preview':
        return 'prévia';
      case 'split':
        return 'dividido';
    }
  }

  get autosaveLabel(): string {
    switch (this.autosaveStatus()) {
      case 'saving':
        return 'Salvando no servidor…';
      case 'saved':
        return this.autosaveServidorEm()
          ? `Salvo no servidor às ${this.autosaveServidorEm()!.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Salvo no servidor';
      case 'offline':
        return 'Sem conexão · backup local ativo';
      case 'conflict':
        return 'Conflito de edição';
      case 'error':
        return 'Falha ao salvar · backup local ativo';
      default:
        return 'Autosave pronto';
    }
  }

  paginaLabel(pagina: Pagina): string {
    return `${'-- '.repeat(this.nivel(pagina))}${pagina.titulo}`;
  }

  nivel(pagina: Pagina): number {
    const porId = new Map(this.paginas().map(item => [item.id, item]));
    let nivel = 0;
    let parentId = pagina.parentId;
    while (parentId && porId.has(parentId)) {
      nivel++;
      parentId = porId.get(parentId)?.parentId;
    }
    return nivel;
  }

  nomeUsuario(username?: string): string {
    return username?.trim() || 'system';
  }

  /** Referência para o sub-componente PaginaRevisoes (recebe via input). */
  readonly nomeUsuarioFn = (u?: string): string => this.nomeUsuario(u);

  /** Referência para o sub-componente PaginaAnexos (recebe via input). */
  readonly anexoUrlFn = (anexo: PaginaAnexo): string => this.anexoUrl(anexo);
  readonly paginaLabelFn = (p: Pagina): string => this.paginaLabel(p);

  private carregarPagina(pagina: Pagina): void {
    this.paginaAtual.set(pagina);
    this.etapaAtiva.set('conteudo');
    this.templateOrigemId.set(pagina.templateOrigemId);
    this.templateOrigemVersao.set(pagina.templateOrigemVersao);
    this.templateSelecionadoId.set(pagina.templateOrigemId ?? null);
    this.form.patchValue(
      {
        titulo: pagina.titulo,
        slug: pagina.slug,
        codigoTela: pagina.codigoTela,
        resumo: pagina.resumo ?? '',
        conteudoHtml: compactarCelulasTabelaHtml(pagina.conteudoHtml ?? ''),
        ordem: pagina.ordem,
        ativo: pagina.ativo,
        projetoId: pagina.projetoId,
        moduloId: pagina.moduloId,
        parentId: pagina.parentId ?? '',
      },
      { emitEvent: false },
    );
    this.atualizarModulosPorProjeto();
    this.historico.recarregar();
    this.paginaService.anexosPagina(pagina.id).subscribe({
      next: anexos => this.anexos.set(anexos),
      error: () => this.toast.error('Erro ao carregar anexos.'),
    });
  }

  private uploadImagem(id: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.paginaService.anexarPagina(id, file).subscribe({
        next: anexo => {
          this.anexos.update(list => [anexo, ...list]);
          const safeName = this.escapeHtml(anexo.nomeOriginal);
          resolve(
            `<figure class="photo"><img src="${this.paginaService.downloadAnexoUrl(anexo)}" alt="${safeName}"><figcaption>${safeName}</figcaption></figure>`,
          );
        },
        error: reject,
      });
    });
  }

  private async garantirRascunhoParaAnexos(): Promise<string | undefined> {
    const existente = this.editId();
    if (existente) return existente;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha título, código da tela, projeto e módulo antes de adicionar imagens.');
      return undefined;
    }
    const draftKeyAntesDoSave = this.draftKey;
    this.saving.set(true);
    try {
      const pagina = await firstValueFrom(this.paginaService.salvarPagina(this.payloadPagina()));
      this.limparRascunho(draftKeyAntesDoSave);
      this.ativarPaginaSalva(pagina);
      this.toast.success('Rascunho criado para armazenar as imagens.');
      return pagina.id;
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Não foi possível criar o rascunho.'));
      return undefined;
    } finally {
      this.saving.set(false);
    }
  }

  private payloadPagina(): Partial<Pagina> {
    const raw = this.form.getRawValue();
    const { projetoId: _projetoId, ...payload } = raw;
    return {
      ...payload,
      conteudoHtml: compactarCelulasTabelaHtml(raw.conteudoHtml ?? ''),
      parentId: raw.parentId || undefined,
      version: this.paginaAtual()?.version,
      templateOrigemId: this.templateOrigemId(),
      templateOrigemVersao: this.templateOrigemVersao(),
    };
  }

  private atualizarPaginaAposPersistencia(pagina: Pagina): void {
    if (!this.editId()) {
      const manterSeletorAberto = this.mostrarTemplates();
      this.ativarPaginaSalva(pagina);
      // O primeiro autosave transforma a página nova em rascunho editável. Isso
      // não deve interromper a escolha/prévia de modelo que estiver em andamento.
      this.mostrarTemplates.set(manterSeletorAberto);
      return;
    }
    this.paginaAtual.set(pagina);
    this.form.controls.slug.setValue(pagina.slug, { emitEvent: false });
    this.dirty = false;
  }

  private ativarPaginaSalva(pagina: Pagina): void {
    this.ia.vincularPagina(pagina.id);
    this.editId.set(pagina.id);
    this.paginaAtual.set(pagina);
    this.form.controls.slug.setValue(pagina.slug, { emitEvent: false });
    this.dirty = false;
    this.justSaved = false;
    this.mostrarTemplates.set(false);
    this.conflitoMensagem.set(null);
    this.atualizarUrlSemNavegar(
      docFlowRouterCommands(['paginas', pagina.id, 'editar']),
      this.queryParamsEditor(),
    );
    this.historico.recarregar();
  }

  private prepararProximaPagina(paginaSalva: Pagina): void {
    const atual = this.form.getRawValue();
    this.editId.set(undefined);
    this.paginaAtual.set(undefined);
    this.anexos.set([]);
    this.historico.limpar();
    this.templateSelecionadoId.set(null);
    this.templateOrigemId.set(undefined);
    this.templateOrigemVersao.set(undefined);
    this.modelos.templateHistorico.set(null);
    this.modelos.templateVersoes.set([]);
    this.mostrarTemplates.set(true);
    this.form.reset(
      {
        titulo: '',
        slug: '',
        codigoTela: '',
        resumo: '',
        conteudoHtml: '',
        ordem: paginaSalva.ordem + 1,
        ativo: true,
        projetoId: atual.projetoId,
        moduloId: atual.moduloId,
        parentId: atual.parentId,
      },
      { emitEvent: false },
    );
    this.dirty = false;
    this.justSaved = false;
    this.rascunhoSalvoEm.set(null);
    this.autosaveStatus.set('idle');
    this.autosaveServidorEm.set(null);
    this.conflitoMensagem.set(null);
    this.atualizarUrlSemNavegar(docFlowRouterCommands(['paginas', 'novo']), {
      ...this.queryParamsEditor(),
      projetoId: atual.projetoId || null,
      moduloId: atual.moduloId || null,
      parentId: atual.parentId || null,
    });
    this.toast.success('Página salva. O próximo cadastro manteve o mesmo contexto.');
  }

  private vincularImportacaoEContinuar(pagina: Pagina, destino: SalvarDestino): void {
    const params = this.route.snapshot.queryParamMap;
    const importacaoId = params.get('importacaoId');
    const paginaPlanoId = params.get('paginaPlanoId');
    if (!importacaoId || !paginaPlanoId) {
      this.executarDestinoDepoisDeSalvar(pagina, destino);
      return;
    }
    this.aiAssistenteService.vincularPaginaImportada(importacaoId, paginaPlanoId, pagina.id).subscribe({
      next: () => this.executarDestinoDepoisDeSalvar(pagina, destino),
      error: () => {
        this.toast.error('A página foi salva, mas não foi possível atualizar o progresso da importação.');
        this.executarDestinoDepoisDeSalvar(pagina, destino);
      },
    });
  }

  private executarDestinoDepoisDeSalvar(pagina: Pagina, destino: SalvarDestino): void {
    const params = this.route.snapshot.queryParamMap;
    const importacaoId = params.get('importacaoId');
    if (destino === 'lista') {
      this.router.navigate(docFlowRouterCommands(['paginas']));
      return;
    }
    if (destino === 'nova' && importacaoId) {
      void this.router.navigate(docFlowRouterCommands(['assistente']), {
        queryParams: compactQueryParams({
          importacaoId,
          projetoId: this.form.controls.projetoId.value,
          moduloId: this.form.controls.moduloId.value,
        }),
      });
      this.toast.success('Página salva e progresso atualizado. Selecione a próxima página do plano.');
      return;
    }
    if (destino === 'nova') {
      this.prepararProximaPagina(pagina);
      return;
    }
    this.ativarPaginaSalva(pagina);
    this.toast.success('Página salva. Você pode continuar editando.');
  }

  private aplicarContextoInicial(): void {
    const params = this.route.snapshot.queryParamMap;
    const projetoId = params.get('projetoId') ?? '';
    const moduloId = params.get('moduloId') ?? '';
    const parentId = params.get('parentId') ?? '';
    if (projetoId && this.projetos().some(projeto => projeto.id === projetoId)) {
      this.form.controls.projetoId.setValue(projetoId, { emitEvent: false });
    }
    this.atualizarModulosPorProjeto();
    if (moduloId && this.modulos().some(modulo => modulo.id === moduloId)) {
      this.form.controls.moduloId.setValue(moduloId, { emitEvent: false });
    }
    if (parentId && this.parentOptions.some(pagina => pagina.id === parentId)) {
      this.form.controls.parentId.setValue(parentId, { emitEvent: false });
    }
    const templateId = params.get('templateId');
    const template = this.templates().find(item => item.id === templateId);
    if (template) void this.selecionarTemplate(template);
  }

  /** Hidrata o form com a proposta entregue pelo assistente IA (`history.state`). */
  private aplicarPropostaAiSePresente(): void {
    const proposta = this.ia.consumirProposta();
    if (!proposta) return;

    this.mostrarTemplates.set(false);
    this.form.patchValue({
      titulo: proposta.titulo ?? '',
      slug: proposta.slug ?? '',
      codigoTela: proposta.codigoTela ?? '',
      resumo: proposta.resumo ?? '',
      conteudoHtml: proposta.conteudoHtml ?? '',
    });
    if (proposta.moduloId && this.modulos().some(m => m.id === proposta.moduloId)) {
      const modulo = this.modulos().find(m => m.id === proposta.moduloId);
      if (modulo) {
        this.form.controls.projetoId.setValue(modulo.projetoId, { emitEvent: false });
        this.atualizarModulosPorProjeto();
        this.form.controls.moduloId.setValue(modulo.id, { emitEvent: false });
      }
    }
    if (proposta.templateOrigemId) {
      this.templateOrigemId.set(proposta.templateOrigemId);
      this.templateOrigemVersao.set(proposta.templateOrigemVersao ?? undefined);
      this.templateSelecionadoId.set(proposta.templateOrigemId);
    }
    // Qualidade recalcula via `formValue`/`qualidadeItens`; marca dirty para canDeactivate.
    this.dirty = true;
    this.justSaved = false;
    this.form.markAsDirty();
    this.toast.success('Proposta da IA aplicada no editor. Revise antes de salvar.');
    void this.anexarImagensAiStaging();
  }

  /** Imagens arrastadas no assistente → upload DocFlow + insert no HTML. */
  private async anexarImagensAiStaging(): Promise<void> {
    const files = this.ia.imagensPendentes();
    if (!files.length) return;
    const paginaId = await this.garantirRascunhoParaAnexos();
    if (!paginaId) {
      this.toast.error(
        'Proposta aplicada, mas as imagens não puderam ser anexadas. Use o botão Foto na toolbar.',
      );
      return;
    }
    try {
      const snippets = await Promise.all(files.map(file => this.uploadImagem(paginaId, file)));
      this.inserirHtml(`\n${snippets.join('\n')}\n`);
      this.toast.success(
        files.length === 1
          ? 'Imagem do assistente anexada ao manual.'
          : `${files.length} imagens do assistente anexadas.`,
      );
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao anexar imagens do assistente.'));
    }
  }

  private aplicarTipoPaginaInicial(): void {
    const tipo = this.route.snapshot.queryParamMap.get('tipoPagina');
    if (tipo !== 'lista' && tipo !== 'incluir' && tipo !== 'editar' && tipo !== 'indice' && tipo !== 'menu')
      return;

    const config = {
      lista: {
        titulo: 'Lista de registros',
        codigo: 'LISTA-001',
        resumo: 'Consulta e listagem de registros com filtros, grade de resultados e ações da tela.',
        kitId: 'kit-lista',
      },
      incluir: {
        titulo: 'Incluir registro',
        codigo: 'INCLUIR-001',
        resumo: 'Formulário para inclusão de novos registros com campos obrigatórios e validações.',
        kitId: 'kit-incluir',
      },
      editar: {
        titulo: 'Editar registro',
        codigo: 'EDITAR-001',
        resumo: 'Formulário para alteração de registros existentes com campos editáveis e validações.',
        kitId: 'kit-editar',
      },
      indice: {
        titulo: 'Operações',
        codigo: 'OPS-001',
        resumo: 'Índice das operações disponíveis neste módulo com links aos guias filhos.',
        kitId: 'kit-indice',
      },
      menu: {
        titulo: 'Menu',
        codigo: 'MENU-001',
        resumo: 'Pasta de navegação com links para as subpáginas desta seção.',
        kitId: 'kit-menu',
      },
    }[tipo];

    if (!this.form.controls.titulo.value.trim()) {
      this.form.controls.titulo.setValue(config.titulo, { emitEvent: false });
    }
    if (!this.form.controls.codigoTela.value.trim()) {
      this.form.controls.codigoTela.setValue(config.codigo, { emitEvent: false });
    }
    if ((this.form.controls.resumo.value?.trim().length ?? 0) < 30) {
      this.form.controls.resumo.setValue(config.resumo, { emitEvent: false });
    }

    const kit = this.blocosCatalogo().find(bloco => bloco.id === config.kitId);
    if (!kit) return;
    const html = aplicarPlaceholdersConteudo(kit.html, this.contextoPlaceholders());
    this.form.controls.conteudoHtml.setValue(html, { emitEvent: false });
    this.mostrarTemplates.set(false);
    this.irParaEtapa('conteudo');
    this.toast.success('Estrutura inicial aplicada conforme o tipo de página.');
  }

  private queryParamsEditor(): Record<string, string | number | null> {
    return {
      modo: this.editorModo() === 'split' ? null : this.editorModo(),
      diff: this.showDiff() ? 1 : null,
      importacaoId: this.route.snapshot.queryParamMap.get('importacaoId'),
      paginaPlanoId: this.route.snapshot.queryParamMap.get('paginaPlanoId'),
    };
  }

  private atualizarUrlSemNavegar(
    commands: (string | number)[],
    queryParams: Record<string, string | number | null>,
  ): void {
    const tree = this.router.createUrlTree(commands, { queryParams: compactQueryParams(queryParams) });
    this.location.replaceState(this.router.serializeUrl(tree));
  }

  private mensagemErro(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) return fallback;
    if (typeof error.error?.message === 'string') return error.error.message;
    return fallback;
  }

  private tratarErroPersistencia(error: unknown, autosave: boolean): void {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      const mensagem = this.mensagemErro(error, 'Esta página foi alterada por outro usuário.');
      this.conflitoMensagem.set(mensagem);
      this.autosaveStatus.set('conflict');
      if (!autosave) this.toast.error(mensagem);
      return;
    }
    if (autosave && error instanceof HttpErrorResponse && error.status === 0) {
      this.autosaveStatus.set('offline');
      return;
    }
    this.autosaveStatus.set('error');
    if (!autosave) this.toast.error(this.mensagemErro(error, 'Erro ao salvar página.'));
  }

  private async persistirParaPreview(): Promise<Pagina | undefined> {
    if (this.autosaveStatus() === 'saving') {
      this.toast.error('Aguarde o salvamento automático terminar antes de abrir a prévia.');
      return undefined;
    }
    const id = this.editId();
    const atual = this.paginaAtual();
    if (id && atual && !this.dirty) return atual;
    const request = id
      ? atual?.status === 'RASCUNHO'
        ? this.paginaService.autosavePagina(id, this.payloadPagina())
        : this.paginaService.salvarPagina(this.payloadPagina(), id)
      : this.paginaService.salvarPagina(this.payloadPagina());
    const draftKeyAntesDoSave = this.draftKey;
    const pagina = await firstValueFrom(request);
    this.limparRascunho(draftKeyAntesDoSave);
    this.atualizarPaginaAposPersistencia(pagina);
    this.autosaveStatus.set('saved');
    this.autosaveServidorEm.set(new Date());
    return pagina;
  }

  private previewLoadingHtml(): string {
    return (
      '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Preparando prévia</title>' +
      '<body style="font:14px system-ui;padding:32px;color:#5f6368">Sincronizando conteúdo e preparando a prévia fiel…</body></html>'
    );
  }

  private escreverErroPreview(previewWindow: Window, message: string): void {
    previewWindow.document.open();
    previewWindow.document.write(
      '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Erro na prévia</title>' +
        `<body style="font:14px system-ui;padding:32px;color:#b42318">${this.escapeHtml(message)}</body></html>`,
    );
    previewWindow.document.close();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private atualizarModulosPorProjeto(limparSelecoes = false): void {
    const projetoId = this.form.controls.projetoId.value;
    const filtrados = projetoId ? this.todosModulos().filter(modulo => modulo.projetoId === projetoId) : [];
    this.modulos.set(filtrados);

    const moduloId = this.form.controls.moduloId.value;
    if (moduloId && !filtrados.some(modulo => modulo.id === moduloId)) {
      this.form.controls.moduloId.setValue('');
      this.form.controls.parentId.setValue('');
      return;
    }

    if (limparSelecoes) {
      this.form.controls.moduloId.setValue('');
      this.form.controls.parentId.setValue('');
    } else {
      const parentId = this.form.controls.parentId.value;
      if (parentId && !this.parentOptions.some(pagina => pagina.id === parentId)) {
        this.form.controls.parentId.setValue('');
      }
    }
  }

  private atualizarEstadoEditor(): void {
    const commands = this.editId()
      ? docFlowRouterCommands(['paginas', this.editId()!, 'editar'])
      : docFlowRouterCommands(['paginas', 'novo']);
    this.router.navigate(commands, {
      replaceUrl: true,
      queryParams: compactQueryParams(
        {
          modo: this.editorModo(),
          diff: this.showDiff() ? 1 : null,
          revisaoSort:
            this.revisoesSort() === 'numero' && this.revisoesDir() === 'DESC' ? null : this.revisoesSort(),
          revisaoDir:
            this.revisoesSort() === 'numero' && this.revisoesDir() === 'DESC' ? null : this.revisoesDir(),
        },
        { modo: 'split' },
      ),
    });
  }

  private compararPaginas = (a: Pagina, b: Pagina): number =>
    a.projetoNome.localeCompare(b.projetoNome) ||
    a.moduloNome.localeCompare(b.moduloNome) ||
    a.ordem - b.ordem ||
    a.titulo.localeCompare(b.titulo);
}
