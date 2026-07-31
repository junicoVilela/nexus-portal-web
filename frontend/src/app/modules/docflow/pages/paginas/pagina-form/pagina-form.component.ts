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
  PaginaRevisao,
  PaginaTemplate,
  PaginaTemplateAplicada,
  PaginaTemplateCriacao,
  PaginaTemplateVersao,
} from '@modules/docflow/models/pagina.model';
import { Projeto } from '@modules/docflow/models/projeto.model';
import { Cliente } from '@modules/docflow/models/cliente.model';
import { compactQueryParams, parseSortDirection, SortDirection } from '@shared/utils/query-state';
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
  compactarCelulasTabelaNoDom,
  contagemTabelasHtml,
  removerColunaHtml,
  removerUltimaLinhaHtml,
} from '@modules/docflow/components/pagina-rich-editor/pagina-table-html';
import { PaginaRevisoesComponent } from '@modules/docflow/components/pagina-revisoes';
import { diffLinhasPalavras, DiffLinha } from '@modules/docflow/utils/diff.util';
import { PaginaAnexosComponent } from '@modules/docflow/components/pagina-anexos';
import {
  AtalhoEditor,
  EditorModo,
  PaginaEditorToolbarComponent,
} from '@modules/docflow/components/pagina-editor-toolbar';
import { PaginaMetaFieldsComponent } from '@modules/docflow/components/pagina-meta-fields';
import { PaginaTemplatePickerComponent } from '@modules/docflow/components/pagina-template-picker';
import { PaginaStatusBadgeComponent } from '@modules/docflow/components/pagina-status-badge';
import { BlocoPagina, PaginaBlockLibraryComponent, blocoPorId } from '@modules/docflow/components/pagina-block-library';
import {
  PaginaSecaoVisual,
  PaginaSectionOrganizerComponent,
} from '@modules/docflow/components/pagina-section-organizer';
import {
  PaginaTemplateSalvarDados,
  PaginaTemplateSaveComponent,
} from '@modules/docflow/components/pagina-template-save';
import {
  PaginaCreationProgressComponent,
  PaginaCreationStep,
  PaginaCreationStepId,
} from '@modules/docflow/components/pagina-creation-progress/pagina-creation-progress.component';
import { avaliarQualidadePagina } from '@modules/docflow/utils/pagina-quality.util';
import {
  aplicarPlaceholdersConteudo,
  ContextoPlaceholdersPagina,
} from '@modules/docflow/utils/pagina-placeholders.util';
import { PaginaDraftService } from '@modules/docflow/services/pagina-draft.service';

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
  ],
  templateUrl: './pagina-form.component.html',
  styleUrl: './pagina-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaFormComponent implements OnInit, AfterViewChecked, OnDestroy, CanDeactivateComponent {
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly paginaDraftService = inject(PaginaDraftService);
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
  protected readonly revisoes = signal<PaginaRevisao[]>([]);
  protected readonly totalRevisoes = signal(0);
  protected readonly paginaAtual = signal<Pagina | undefined>(undefined);
  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly saving = signal(false);
  protected readonly showDiff = signal(false);
  protected readonly editorModo = signal<EditorModo>('rico');
  protected readonly revisoesPage = signal(1);
  protected readonly revisoesPageSize = signal(10);
  protected readonly revisoesSort = signal('numero');
  protected readonly revisoesDir = signal<SortDirection>('DESC');
  protected readonly diffLinhas = signal<DiffLinha[]>([]);
  protected readonly rascunhoSalvoEm = signal<Date | null>(null);
  protected readonly templates = signal<PaginaTemplate[]>([]);
  protected readonly templateSelecionadoId = signal<string | null>(null);
  protected readonly templateOrigemId = signal<string | undefined>(undefined);
  protected readonly templateOrigemVersao = signal<number | undefined>(undefined);
  protected readonly templateEmEdicao = signal<PaginaTemplate | null>(null);
  protected readonly templateHistorico = signal<PaginaTemplate | null>(null);
  protected readonly templateVersoes = signal<PaginaTemplateVersao[]>([]);
  protected readonly versaoComparacaoA = signal<number | null>(null);
  protected readonly versaoComparacaoB = signal<number | null>(null);
  protected readonly versoesEmComparacao = computed(() => ({
    a: this.templateVersoes().find(item => item.numero === this.versaoComparacaoA()),
    b: this.templateVersoes().find(item => item.numero === this.versaoComparacaoB()),
  }));
  protected readonly templatePreview = signal<{
    template: PaginaTemplate;
    aplicado: PaginaTemplateAplicada;
  } | null>(null);
  protected readonly previsualizandoTemplateId = signal<string | null>(null);
  protected readonly carregandoVersoesTemplate = signal(false);
  protected readonly aplicandoTemplate = signal(false);
  protected readonly somenteTemplatesContexto = signal(true);
  protected readonly incluirTemplatesArquivados = signal(false);
  protected readonly mostrarTemplates = signal(false);
  protected readonly mostrarSalvarTemplate = signal(false);
  protected readonly salvandoTemplate = signal(false);
  protected readonly autosaveStatus = signal<AutosaveStatus>('idle');
  protected readonly autosaveServidorEm = signal<Date | null>(null);
  protected readonly conflitoMensagem = signal<string | null>(null);
  protected readonly previewing = signal(false);
  protected readonly organizandoSecoes = signal(false);
  protected readonly etapaAtiva = signal<PaginaCreationStepId>('modelo');
  protected readonly podeCriarTemplate = computed(() => this.auth.tem()('PAGINA:CRIAR'));
  protected readonly podeEditarTemplate = computed(() => this.auth.tem()('PAGINA:EDITAR'));
  protected readonly podeExcluirTemplate = computed(() => this.auth.tem()('PAGINA:EXCLUIR'));
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

  protected readonly qualidadeItens = computed<PaginaQualidadeItem[]>(() =>
    avaliarQualidadePagina(this.formValue()),
  );

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
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly confirmService: ConfirmService,
  ) {}

  private get draftKey(): string {
    return `docflow:pagina-form:${this.editId() ?? 'novo'}`;
  }

  ngOnInit(): void {
    this.editId.set(this.route.snapshot.paramMap.get('id') ?? undefined);
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
    }).subscribe({
      next: ({ projetos, clientes, modulos, paginas, pagina, templates }) => {
        this.projetos.set(projetos);
        this.clientes.set(clientes);
        this.todosModulos.set(modulos);
        this.paginas.set(paginas);
        this.templates.set(templates);
        if (pagina) {
          this.carregarPagina(pagina);
        } else {
          this.mostrarTemplates.set(true);
          this.aplicarContextoInicial();
          this.aplicarTipoPaginaInicial();
        }
        this.carregarTemplates();
        this.restaurarRascunho();
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
        if (destino === 'lista') {
          this.router.navigate(docFlowRouterCommands(['paginas']));
          return;
        }
        if (destino === 'nova') {
          this.prepararProximaPagina(pagina);
          return;
        }
        this.ativarPaginaSalva(pagina);
        this.toast.success('Página salva. Você pode continuar editando.');
      },
      error: error => {
        this.saving.set(false);
        this.tratarErroPersistencia(error, false);
      },
    });
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
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
    event.preventDefault();
    this.salvar('continuar');
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
    const placeholder = /\{\{\s*[a-zA-Z0-9_.-]+\s*}}|\b(explique|descreva|informe|liste|registre aqui|nome do campo|escreva uma resposta)\b/i;
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
    this.carregarTemplates();
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
    const atual = this.form.controls.conteudoHtml.value ?? '';
    if (contagemTabelasHtml(atual) === 0) {
      this.toast.warn('Inclua um dicionário/tabela no conteúdo antes de adicionar linhas.');
      return;
    }

    if (this.editorModo() === 'rico' && this.richEditor?.podeAdicionar()) {
      if (acao === 'add') this.richEditor.adicionarLinhaTabela();
      else this.richEditor.removerLinhaTabela();
      return;
    }

    const proximo =
      acao === 'add' ? adicionarLinhaHtml(atual, tableIndex) : removerUltimaLinhaHtml(atual, tableIndex);
    if (proximo === atual && acao === 'remove') {
      this.toast.warn('A tabela precisa manter ao menos uma linha.');
      return;
    }
    this.form.controls.conteudoHtml.setValue(proximo);
    this.form.controls.conteudoHtml.markAsDirty();
    this.dirty = true;
    if (this.editorModo() === 'rico' && this.richEditor) {
      this.richEditor.aplicarHtml(proximo);
    }
    this.tabelasDecoradasAssinatura = '';
  }

  private alterarColunasTabela(acao: 'add' | 'remove', tableIndex = 0): void {
    const atual = this.form.controls.conteudoHtml.value ?? '';
    if (contagemTabelasHtml(atual) === 0) {
      this.toast.warn('Inclua um dicionário/tabela no conteúdo antes de alterar colunas.');
      return;
    }

    if (this.editorModo() === 'rico' && this.richEditor?.podeAdicionarColuna()) {
      if (acao === 'add') this.richEditor.adicionarColunaTabela();
      else this.richEditor.removerColunaTabela();
      return;
    }

    const proximo =
      acao === 'add' ? adicionarColunaHtml(atual, tableIndex) : removerColunaHtml(atual, tableIndex);
    if (proximo === atual && acao === 'remove') {
      this.toast.warn('A tabela precisa manter ao menos uma coluna.');
      return;
    }
    this.form.controls.conteudoHtml.setValue(proximo);
    this.form.controls.conteudoHtml.markAsDirty();
    this.dirty = true;
    if (this.editorModo() === 'rico' && this.richEditor) {
      this.richEditor.aplicarHtml(proximo);
    }
    this.tabelasDecoradasAssinatura = '';
  }

  private decorarTabelasPreview(): void {
    const root = this.previewBody?.nativeElement;
    if (!root || this.editorModo() === 'codigo') return;
    const html = this.form.controls.conteudoHtml.value ?? '';
    const assinatura = `${this.editorModo()}|${html.length}|${contagemTabelasHtml(html)}`;
    if (assinatura === this.tabelasDecoradasAssinatura && root.querySelector('.pf-table-chrome')) return;

    root.querySelectorAll('.pf-table-chrome').forEach(el => el.remove());
    compactarCelulasTabelaNoDom(root);
    const tables = Array.from(root.querySelectorAll('table'));
    tables.forEach((table, index) => {
      const chrome = document.createElement('div');
      chrome.className = 'pf-table-chrome';
      chrome.setAttribute('contenteditable', 'false');
      chrome.innerHTML = `
        <span class="pf-table-chrome__label">Tabela</span>
        <button type="button" class="pf-table-chrome__btn" data-table-action="add-row" data-table-index="${index}">+ Linha</button>
        <button type="button" class="pf-table-chrome__btn pf-table-chrome__btn--danger" data-table-action="remove-row" data-table-index="${index}">− Linha</button>
        <button type="button" class="pf-table-chrome__btn" data-table-action="add-col" data-table-index="${index}">+ Coluna</button>
        <button type="button" class="pf-table-chrome__btn pf-table-chrome__btn--danger" data-table-action="remove-col" data-table-index="${index}">− Coluna</button>
      `;
      table.parentElement?.insertBefore(chrome, table);
    });
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
    const secaoHtml = this.montarSecaoGuiasDisponiveis(filhos);
    const html = this.form.controls.conteudoHtml.value ?? '';
    const proximo = this.substituirOuAdicionarSecaoGuias(html, secaoHtml);
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
    this.aplicandoTemplate.set(true);
    try {
      const aplicado = await firstValueFrom(
        this.paginaService.aplicarTemplatePagina(template.id, this.contextoAplicacaoTemplate(template)),
      );
      this.templateSelecionadoId.set(template.id);
      this.templateOrigemId.set(aplicado.templateId);
      this.templateOrigemVersao.set(aplicado.versao);
      this.form.controls.conteudoHtml.setValue(aplicado.conteudoHtml);
      this.templatePreview.set(null);
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
      this.aplicandoTemplate.set(false);
    }
  }

  async previsualizarTemplate(template: PaginaTemplate): Promise<void> {
    if (this.previsualizandoTemplateId()) return;
    this.previsualizandoTemplateId.set(template.id);
    try {
      const aplicado = await firstValueFrom(
        this.paginaService.aplicarTemplatePagina(template.id, this.contextoAplicacaoTemplate(template)),
      );
      this.templatePreview.set({ template, aplicado });
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Não foi possível gerar a prévia deste modelo.'));
    } finally {
      this.previsualizandoTemplateId.set(null);
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

  salvarTemplatePersonalizado(dados: PaginaTemplateSalvarDados): void {
    const conteudoHtml = this.form.controls.conteudoHtml.value.trim();
    if (!conteudoHtml || this.salvandoTemplate()) return;
    const edicao = this.templateEmEdicao();
    const payload: PaginaTemplateCriacao = {
      nome: dados.nome,
      descricao: dados.descricao,
      projetoId: dados.projetoId,
      clienteId: dados.clienteId,
      conteudoHtml: edicao && !dados.substituirConteudo ? edicao.conteudoHtml : conteudoHtml,
    };
    this.salvandoTemplate.set(true);
    const request = edicao
      ? this.paginaService.atualizarTemplatePagina(edicao.id, payload)
      : this.paginaService.criarTemplatePagina(payload);
    request.subscribe({
      next: template => {
        this.templates.update(templates =>
          edicao
            ? templates.map(item => (item.id === template.id ? template : item))
            : [...templates, template],
        );
        this.mostrarSalvarTemplate.set(false);
        this.templateEmEdicao.set(null);
        this.mostrarTemplates.set(true);
        this.salvandoTemplate.set(false);
        this.toast.success(
          edicao
            ? `Modelo "${template.nome}" atualizado para a versão ${template.versaoAtual}.`
            : `Modelo "${template.nome}" criado para ${this.escopoTemplate(template)}.`,
        );
      },
      error: error => {
        this.salvandoTemplate.set(false);
        this.toast.error(this.mensagemErro(error, 'Erro ao criar modelo personalizado.'));
      },
    });
  }

  editarTemplatePersonalizado(template: PaginaTemplate): void {
    if (!template.personalizado) return;
    this.templateEmEdicao.set(template);
    this.mostrarSalvarTemplate.set(true);
  }

  async duplicarTemplate(template: PaginaTemplate): Promise<void> {
    const clienteId = template.clienteId;
    const projetoId = clienteId
      ? undefined
      : (template.projetoId ?? (this.form.controls.projetoId.value || undefined));
    if (!projetoId && !clienteId) {
      this.toast.error('Selecione um projeto antes de duplicar um modelo do sistema.');
      return;
    }
    try {
      const copia = await firstValueFrom(
        this.paginaService.duplicarTemplatePagina(template.id, {
          nome: `Cópia de ${template.nome}`.slice(0, 120),
          projetoId,
          clienteId,
        }),
      );
      this.templates.update(items => [...items, copia]);
      this.toast.success(`Modelo duplicado como "${copia.nome}".`);
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao duplicar modelo.'));
    }
  }

  async arquivarTemplate(template: PaginaTemplate): Promise<void> {
    const confirmado = await this.confirmService.confirm({
      title: 'Arquivar modelo?',
      message: `O modelo "${template.nome}" deixará de aparecer para criação de páginas, mas seu histórico será mantido.`,
      acceptLabel: 'Arquivar modelo',
      variant: 'danger',
      icon: 'Archive',
    });
    if (!confirmado) return;
    try {
      const atualizado = await firstValueFrom(this.paginaService.arquivarTemplatePagina(template.id));
      this.atualizarTemplateNaLista(atualizado);
      this.toast.success('Modelo arquivado.');
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao arquivar modelo.'));
    }
  }

  async reativarTemplate(template: PaginaTemplate): Promise<void> {
    try {
      const atualizado = await firstValueFrom(this.paginaService.reativarTemplatePagina(template.id));
      this.atualizarTemplateNaLista(atualizado);
      this.toast.success('Modelo reativado.');
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao reativar modelo.'));
    }
  }

  abrirHistoricoTemplate(template: PaginaTemplate): void {
    this.templateHistorico.set(template);
    this.carregandoVersoesTemplate.set(true);
    this.paginaService.versoesTemplatePagina(template.id).subscribe({
      next: versoes => {
        this.templateVersoes.set(versoes);
        this.versaoComparacaoA.set(versoes[0]?.numero ?? null);
        this.versaoComparacaoB.set(versoes[1]?.numero ?? null);
        this.carregandoVersoesTemplate.set(false);
      },
      error: error => {
        this.carregandoVersoesTemplate.set(false);
        this.toast.error(this.mensagemErro(error, 'Erro ao carregar versões do modelo.'));
      },
    });
  }

  selecionarVersaoComparacao(versao: PaginaTemplateVersao): void {
    if (this.versaoComparacaoA() === versao.numero) {
      this.versaoComparacaoA.set(null);
      return;
    }
    if (this.versaoComparacaoB() === versao.numero) {
      this.versaoComparacaoB.set(null);
      return;
    }
    if (this.versaoComparacaoA() === null) {
      this.versaoComparacaoA.set(versao.numero);
    } else if (this.versaoComparacaoB() === null) {
      this.versaoComparacaoB.set(versao.numero);
    } else {
      this.versaoComparacaoA.set(this.versaoComparacaoB());
      this.versaoComparacaoB.set(versao.numero);
    }
  }

  async restaurarVersaoTemplate(versao: PaginaTemplateVersao): Promise<void> {
    const template = this.templateHistorico();
    if (!template || !template.personalizado || versao.numero === template.versaoAtual) return;
    const confirmado = await this.confirmService.confirm({
      title: `Restaurar versão ${versao.numero}?`,
      message: 'O estado selecionado será salvo como uma nova versão, sem apagar o histórico atual.',
      acceptLabel: 'Restaurar versão',
      icon: 'History',
    });
    if (!confirmado) return;
    try {
      const atualizado = await firstValueFrom(
        this.paginaService.restaurarVersaoTemplatePagina(template.id, versao.numero),
      );
      this.atualizarTemplateNaLista(atualizado);
      this.templateHistorico.set(atualizado);
      this.abrirHistoricoTemplate(atualizado);
      this.toast.success(`Versão ${versao.numero} restaurada como versão ${atualizado.versaoAtual}.`);
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao restaurar versão do modelo.'));
    }
  }

  alterarContextoTemplates(somenteContexto: boolean): void {
    this.somenteTemplatesContexto.set(somenteContexto);
    this.carregarTemplates();
  }

  alterarArquivadosTemplates(incluirArquivados: boolean): void {
    this.incluirTemplatesArquivados.set(incluirArquivados);
    this.carregarTemplates();
  }

  async excluirTemplatePersonalizado(template: PaginaTemplate): Promise<void> {
    if (!template.personalizado) return;
    const confirmado = await this.confirmService.confirm({
      title: 'Excluir modelo personalizado?',
      message: `O modelo "${template.nome}" será removido. Páginas que já usaram esta estrutura não serão alteradas.`,
      acceptLabel: 'Excluir modelo',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;
    try {
      await firstValueFrom(this.paginaService.excluirTemplatePagina(template.id));
      this.templates.update(templates => templates.filter(item => item.id !== template.id));
      if (this.templateSelecionadoId() === template.id) this.templateSelecionadoId.set(null);
      if (this.templateHistorico()?.id === template.id) {
        this.templateHistorico.set(null);
        this.templateVersoes.set([]);
      }
      this.toast.success('Modelo personalizado excluído.');
    } catch (error) {
      this.toast.error(this.mensagemErro(error, 'Erro ao excluir modelo personalizado.'));
    }
  }

  private escopoTemplate(template: PaginaTemplate): string {
    if (template.projetoNome) return `o projeto ${template.projetoNome}`;
    if (template.clienteNome) return `o cliente ${template.clienteNome}`;
    return 'o escopo selecionado';
  }

  private carregarTemplates(): void {
    this.paginaService
      .templatesPagina({
        projetoId: this.form.controls.projetoId.value || undefined,
        somenteContexto: this.somenteTemplatesContexto(),
        incluirArquivados: this.incluirTemplatesArquivados(),
      })
      .subscribe({
        next: templates => this.templates.set(templates),
        error: error => this.toast.error(this.mensagemErro(error, 'Erro ao carregar modelos de página.')),
      });
  }

  private atualizarTemplateNaLista(template: PaginaTemplate): void {
    this.templates.update(items => items.map(item => (item.id === template.id ? template : item)));
    if (this.templateSelecionadoId() === template.id && template.ativo === false) {
      this.templateSelecionadoId.set(null);
    }
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

  alterarPaginaRevisoes(page: number): void {
    this.revisoesPage.set(page);
    this.carregarRevisoes();
  }

  alterarTamanhoPaginaRevisoes(size: number): void {
    this.revisoesPageSize.set(size);
    this.revisoesPage.set(1);
    this.carregarRevisoes();
  }

  ordenarRevisoes(campo: string): void {
    if (this.revisoesSort() === campo) {
      this.revisoesDir.set(this.revisoesDir() === 'ASC' ? 'DESC' : 'ASC');
    } else {
      this.revisoesSort.set(campo);
      this.revisoesDir.set('ASC');
    }
    this.revisoesPage.set(1);
    this.atualizarEstadoEditor();
    this.carregarRevisoes();
  }

  indicacaoOrdenacaoRevisoes(campo: string): string {
    if (this.revisoesSort() !== campo) return '↕';
    return this.revisoesDir() === 'ASC' ? '↑' : '↓';
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
    this.revisoesPage.set(1);
    this.carregarRevisoes();
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
    this.revisoesPage.set(1);
    this.carregarRevisoes();
  }

  private prepararProximaPagina(paginaSalva: Pagina): void {
    const atual = this.form.getRawValue();
    this.editId.set(undefined);
    this.paginaAtual.set(undefined);
    this.anexos.set([]);
    this.revisoes.set([]);
    this.totalRevisoes.set(0);
    this.templateSelecionadoId.set(null);
    this.templateOrigemId.set(undefined);
    this.templateOrigemVersao.set(undefined);
    this.templateHistorico.set(null);
    this.templateVersoes.set([]);
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

  private aplicarTipoPaginaInicial(): void {
    const tipo = this.route.snapshot.queryParamMap.get('tipoPagina');
    if (tipo !== 'lista' && tipo !== 'incluir' && tipo !== 'indice') return;

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
      indice: {
        titulo: 'Operações',
        codigo: 'OPS-001',
        resumo: 'Índice das operações disponíveis neste módulo com links aos guias filhos.',
        kitId: 'kit-indice',
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

    const kit = blocoPorId(config.kitId);
    if (!kit) return;
    const html = aplicarPlaceholdersConteudo(kit.html, this.contextoPlaceholders());
    this.form.controls.conteudoHtml.setValue(html, { emitEvent: false });
    this.mostrarTemplates.set(false);
    this.irParaEtapa('conteudo');
    this.toast.success('Estrutura inicial aplicada conforme o tipo de página.');
  }

  private montarSecaoGuiasDisponiveis(filhos: Pagina[]): string {
    const items = filhos
      .map((filho, index) => {
        const resumo = (filho.resumo?.trim() || 'Sem resumo').slice(0, 80);
        return (
          `<article class="resource-item"><span class="number-badge">${index + 1}</span><span><strong>${this.escapeHtml(filho.titulo)}</strong><small>${this.escapeHtml(resumo)}</small></span>` +
          `<span class="resource-item__meta">${this.escapeHtml(filho.codigoTela)}</span></article>`
        );
      })
      .join('');
    return `<section class="doc-section"><h2>Guias disponíveis</h2><div class="resource-list resource-list--large">${items}</div></section>`;
  }

  private substituirOuAdicionarSecaoGuias(html: string, secaoHtml: string): string {
    if (!html.trim()) return secaoHtml;
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    const body = doc.body;
    const existente = Array.from(body.querySelectorAll('section')).find(secao => {
      const h2 = secao.querySelector('h2');
      return h2?.textContent?.trim().toLowerCase() === 'guias disponíveis';
    });
    if (existente) {
      const temp = new DOMParser().parseFromString(secaoHtml, 'text/html');
      const nova = temp.body.firstElementChild;
      if (nova) existente.replaceWith(nova);
    } else {
      body.insertAdjacentHTML('beforeend', secaoHtml);
    }
    return body.innerHTML;
  }

  private queryParamsEditor(): Record<string, string | number | null> {
    return {
      modo: this.editorModo() === 'split' ? null : this.editorModo(),
      diff: this.showDiff() ? 1 : null,
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

  async toggleDiff(): Promise<void> {
    this.showDiff.update(v => !v);
    this.atualizarEstadoEditor();
    const lista = this.revisoes();
    if (this.showDiff() && lista.length >= 2) {
      const anterior = lista[1].conteudoHtml || lista[1].titulo || '';
      const atual = lista[0].conteudoHtml || lista[0].titulo || '';
      const linhas = await diffLinhasPalavras(anterior, atual);
      this.diffLinhas.set(linhas);
    }
  }

  private carregarRevisoes(): void {
    const atual = this.paginaAtual();
    if (!atual) return;
    this.paginaService
      .listarRevisoesPagina(
        atual.id,
        this.revisoesPage(),
        this.revisoesPageSize(),
        this.revisoesSort(),
        this.revisoesDir(),
      )
      .subscribe({
        next: response => {
          this.revisoes.set(response.items);
          this.totalRevisoes.set(response.totalItems);
          this.revisoesPage.set(response.page);
          this.revisoesPageSize.set(response.size);
        },
        error: () => this.toast.error('Erro ao carregar revisões.'),
      });
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
