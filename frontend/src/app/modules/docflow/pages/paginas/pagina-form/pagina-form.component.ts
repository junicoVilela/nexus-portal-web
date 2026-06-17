import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { TIMINGS } from '@core/config/timings';
import { idadeEmDias } from '@shared/utils/dates';
import { CanDeactivateComponent } from '@shared/guards';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Modulo } from '@modules/docflow/models/modulo.model';
import { Pagina, PaginaAnexo, PaginaRevisao } from '@modules/docflow/models/pagina.model';
import { Projeto } from '@modules/docflow/models/projeto.model';
import { compactQueryParams, parseSortDirection, SortDirection } from '@shared/utils/query-state';
import {
  PageHeaderComponent,
  ButtonComponent,
  BadgeComponent,
  ConfirmService,
  SkeletonComponent,
  ToastService,
} from '@shared/ui';
import { PaginaRichEditorComponent } from '@modules/docflow/components/pagina-rich-editor';
import { PaginaRevisoesComponent } from '@modules/docflow/components/pagina-revisoes';
import { diffLinhasPalavras, DiffLinha } from '@modules/docflow/utils/diff.util';
import { PaginaAnexosComponent } from '@modules/docflow/components/pagina-anexos';
import {
  AtalhoEditor,
  EditorModo,
  PaginaEditorToolbarComponent,
} from '@modules/docflow/components/pagina-editor-toolbar';
import { PaginaMetaFieldsComponent } from '@modules/docflow/components/pagina-meta-fields';

@Component({
  selector: 'app-pagina-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    PageHeaderComponent,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent,
    PaginaRichEditorComponent,
    PaginaRevisoesComponent,
    PaginaAnexosComponent,
    PaginaEditorToolbarComponent,
    PaginaMetaFieldsComponent,
  ],
  templateUrl: './pagina-form.component.html',
  styleUrl: './pagina-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaFormComponent implements OnInit, OnDestroy, CanDeactivateComponent {
  private readonly toast = inject(ToastService);

  @ViewChild('conteudoHtmlInput') conteudoHtmlInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fotoInput') fotoInput?: ElementRef<HTMLInputElement>;

  private readonly destroy$ = new Subject<void>();
  private dirty = false;
  private justSaved = false;

  // ───── Signals: estado reativo ─────
  protected readonly projetos = signal<Projeto[]>([]);
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
          '<table>\n <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>\n <tbody><tr><td>Nome</td><td>Informe o nome.</td></tr></tbody>\n</table>',
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
    projetoId: [''],
    moduloId: ['', Validators.required],
    parentId: [''],
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

  constructor(
    private readonly fb: FormBuilder,
    private readonly projetoService: ProjetoService,
    private readonly moduloService: ModuloService,
    private readonly paginaService: PaginaService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
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
      modulos: this.moduloService.modulos(),
      paginas: this.paginaService.paginas(),
      pagina: this.editId() ? this.paginaService.pagina(this.editId()!) : of(undefined),
    }).subscribe({
      next: ({ projetos, modulos, paginas, pagina }) => {
        this.projetos.set(projetos);
        this.todosModulos.set(modulos);
        this.atualizarModulosPorProjeto();
        this.paginas.set(paginas);
        if (pagina) this.carregarPagina(pagina);
        this.restaurarRascunho();
        this.inicializarAutoSave();
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
        try {
          localStorage.setItem(this.draftKey, JSON.stringify({ value, at: Date.now() }));
          this.rascunhoSalvoEm.set(new Date());
        } catch {
          /* storage full / disabled */
        }
      });
  }

  private restaurarRascunho(): void {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return;
      const { value, at } = JSON.parse(raw) as { value: unknown; at: number };
      if (!value || typeof value !== 'object') return;
      const ageDays = idadeEmDias(at);
      if (ageDays > TIMINGS.draftMaxAgeDays) {
        localStorage.removeItem(this.draftKey);
        return;
      }
      this.form.patchValue(value as Record<string, unknown>);
      this.rascunhoSalvoEm.set(new Date(at));
      this.toast.success('Rascunho local restaurado.');
    } catch {
      localStorage.removeItem(this.draftKey);
    }
  }

  private limparRascunho(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {
      /* noop */
    }
    this.dirty = false;
    this.rascunhoSalvoEm.set(null);
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    // projetoId não vai no payload (deriva do moduloId no backend)
    const { projetoId: _projetoId, ...rest } = raw;
    const payload = { ...rest, parentId: raw.parentId || undefined };
    this.saving.set(true);
    this.paginaService.salvarPagina(payload, this.editId()).subscribe({
      next: () => {
        this.justSaved = true;
        this.limparRascunho();
        this.router.navigate(docFlowRouterCommands(['paginas']));
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao salvar página.');
      },
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
  }

  definirEditorModo(modo: EditorModo): void {
    this.editorModo.set(modo);
    this.atualizarEstadoEditor();
  }

  executarAtalho(atalho: AtalhoEditor): void {
    atalho.action();
  }

  anexarFotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    if (this.editId()) {
      Promise.all(files.map(file => this.uploadImagem(file)))
        .then(snippets => {
          this.inserirHtml(snippets.join('\n'));
          input.value = '';
        })
        .catch(() => {
          this.toast.error('Erro ao anexar imagem.');
          input.value = '';
        });
      return;
    }
    const readers = files.map(file =>
      this.lerArquivoComoDataUrl(file).then(dataUrl => {
        const safeName = this.escapeHtml(file.name);
        return `<figure class="photo"><img src="${dataUrl}" alt="${safeName}"><figcaption>${safeName}</figcaption></figure>`;
      }),
    );
    Promise.all(readers).then(snippets => {
      this.inserirHtml(snippets.join('\n'));
      input.value = '';
    });
  }

  inserirHtml(snippet: string): void {
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

  inserirDica(): void {
    this.inserirHtml('<div class="callout"><strong>Dica:</strong> registre uma orientação importante.</div>');
  }

  inserirAtencao(): void {
    this.inserirHtml(
      '<div class="warning"><strong>Atenção:</strong> valide esta etapa antes de continuar.</div>',
    );
  }

  inserirPassoAPasso(): void {
    this.inserirHtml(
      '<section class="steps"><h2>Passo a passo</h2><ol><li>Acesse a tela.</li><li>Preencha os campos obrigatórios.</li><li>Confirme a operação.</li></ol></section>',
    );
  }

  inserirFaq(): void {
    this.inserirHtml(
      '<section class="faq"><h2>Perguntas frequentes</h2><h3>Quando usar esta tela?</h3><p>Descreva o cenário de uso.</p></section>',
    );
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
    return html?.trim() ? html : '<p>Sem conteúdo HTML cadastrado.</p>';
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
    this.form.patchValue({
      titulo: pagina.titulo,
      slug: pagina.slug,
      codigoTela: pagina.codigoTela,
      resumo: pagina.resumo ?? '',
      conteudoHtml: pagina.conteudoHtml ?? '',
      ordem: pagina.ordem,
      ativo: pagina.ativo,
      projetoId: pagina.projetoId,
      moduloId: pagina.moduloId,
      parentId: pagina.parentId ?? '',
    });
    this.atualizarModulosPorProjeto();
    this.revisoesPage.set(1);
    this.carregarRevisoes();
    this.paginaService.anexosPagina(pagina.id).subscribe({
      next: anexos => this.anexos.set(anexos),
      error: () => this.toast.error('Erro ao carregar anexos.'),
    });
  }

  private uploadImagem(file: File): Promise<string> {
    const id = this.editId();
    if (!id) return this.lerArquivoComoDataUrl(file);
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

  private lerArquivoComoDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
      reader.readAsDataURL(file);
    });
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
      const linhas = await diffLinhasPalavras(lista[1].titulo || '', lista[0].titulo || '');
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
    this.router.navigate([], {
      relativeTo: this.route,
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
