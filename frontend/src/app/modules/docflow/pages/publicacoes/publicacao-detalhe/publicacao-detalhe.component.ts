import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import {
  MudancaPublicacao,
  Publicacao,
  PublicacaoDiff,
  PublicacaoDiffItem,
  PublicacaoPaginaSnapshot,
} from '@modules/docflow/models/publicacao.model';
import { DiffLinha, diffLinhasPalavras } from '@modules/docflow/utils/diff.util';
import { ChangelogItem } from '@modules/docflow/models/pagina.model';
import {
  PageHeaderComponent,
  ButtonComponent,
  CardComponent,
  BadgeComponent,
  ConfirmService,
  ToastService,
  TabItem,
  TabsComponent,
} from '@shared/ui';
import { PermissaoDirective } from '@modules/identity-access/directives';

type PublicacaoDetalheTab = 'visao-geral' | 'paginas' | 'changelog' | 'comparar' | 'downloads';

interface PaginaChangelogResumo {
  paginaTitulo: string;
  tipoMudanca: ChangelogItem['tipoMudanca'];
}

interface PaginaArvoreItem {
  id?: string;
  titulo: string;
  codigoTela?: string;
  nivel: number;
  tipoMudanca?: ChangelogItem['tipoMudanca'];
}

@Component({
  selector: 'app-publicacao-detalhe',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    BadgeComponent,
    TabsComponent,
    PermissaoDirective,
  ],
  templateUrl: './publicacao-detalhe.component.html',
  styleUrl: './publicacao-detalhe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacaoDetalheComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected id = '';
  protected readonly publicacao = signal<Publicacao | undefined>(undefined);
  protected readonly changelog = signal<ChangelogItem[]>([]);
  protected readonly snapshotPaginas = signal<PublicacaoPaginaSnapshot[]>([]);
  protected readonly relatorioJson = signal<Record<string, unknown> | null>(null);
  protected readonly excluindo = signal(false);
  protected readonly baixandoZip = signal(false);
  protected readonly baixandoPdf = signal(false);
  protected readonly cancelando = signal(false);
  protected readonly diff = signal<PublicacaoDiff | null>(null);
  protected readonly carregandoDiff = signal(false);
  protected readonly erroDiff = signal<string | null>(null);
  protected readonly paginaComparada = signal<PublicacaoDiffItem | null>(null);
  protected readonly linhasConteudo = signal<DiffLinha[]>([]);
  protected readonly carregandoConteudo = signal(false);
  /** Mudanças que valem destaque; INALTERADA fica no rodapé como contagem. */
  readonly mudancasRelevantes: MudancaPublicacao[] = [
    'ADICIONADA',
    'ALTERADA',
    'REMOVIDA',
    'MOVIDA',
    'INDETERMINADA',
  ];
  protected readonly activeTab = signal<PublicacaoDetalheTab>('visao-geral');
  readonly mudancaTipos = ['ADICIONADO', 'ATUALIZADO', 'REMOVIDO'] as const;

  protected readonly avisosValidacao = computed<string[]>(() => {
    const raw = this.relatorioJson()?.['avisos'];
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is string => typeof item === 'string');
  });

  protected readonly paginasUnicas = computed<PaginaChangelogResumo[]>(() => {
    const vistos = new Set<string>();
    const resultado: PaginaChangelogResumo[] = [];
    for (const item of this.changelog()) {
      const chave = item.paginaId ?? item.paginaTitulo;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      resultado.push({ paginaTitulo: item.paginaTitulo, tipoMudanca: item.tipoMudanca });
    }
    return resultado;
  });

  protected readonly paginasArvore = computed<PaginaArvoreItem[]>(() => {
    const snapshot = this.snapshotPaginas();
    const changelogPorPagina = new Map<string, ChangelogItem['tipoMudanca']>();
    for (const item of this.changelog()) {
      if (item.paginaId) changelogPorPagina.set(item.paginaId, item.tipoMudanca);
    }

    if (snapshot.length) {
      return this.montarHierarquiaSnapshot(snapshot, changelogPorPagina);
    }

    return this.paginasUnicas().map(item => ({
      titulo: item.paginaTitulo,
      nivel: 0,
      tipoMudanca: item.tipoMudanca,
    }));
  });

  protected readonly tabsConfig = computed<TabItem<PublicacaoDetalheTab>[]>(() => [
    { id: 'visao-geral', label: 'Visão geral', icon: 'LayoutDashboard' },
    {
      id: 'paginas',
      label: 'Páginas',
      icon: 'FileText',
      count: this.paginasArvore().length || undefined,
    },
    { id: 'changelog', label: 'Changelog', icon: 'List', count: this.changelog().length || undefined },
    { id: 'comparar', label: 'Comparar', icon: 'GitCompare' },
    { id: 'downloads', label: 'Downloads', icon: 'Download' },
  ]);

  protected nav = (...segments: string[]): (string | number)[] => docFlowRouterCommands(segments);

  constructor(
    private readonly publicacaoService: PublicacaoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.router.navigate(docFlowRouterCommands(['publicacoes']));
      return;
    }
    forkJoin({
      publicacao: this.publicacaoService.publicacaoPorId(this.id),
      changelog: this.publicacaoService.changelogPublicacao(this.id).pipe(catchError(() => of([]))),
      snapshot: this.publicacaoService
        .arvorePaginasPublicacao(this.id)
        .pipe(catchError(() => of([] as PublicacaoPaginaSnapshot[]))),
    }).subscribe({
      next: ({ publicacao, changelog, snapshot }) => {
        this.publicacao.set(publicacao);
        this.relatorioJson.set(this.tryParse(publicacao.relatorioValidacao));
        this.changelog.set(changelog);
        this.snapshotPaginas.set(snapshot);
      },
      error: () => this.toast.error('Não foi possível carregar a publicação.'),
    });
  }

  /** O cancelamento só faz sentido enquanto a geração não terminou. */
  podeCancelar(): boolean {
    const pub = this.publicacao();
    return !!pub && pub.status === 'GERANDO' && !pub.cancelamentoSolicitado;
  }

  async cancelar(): Promise<void> {
    const pub = this.publicacao();
    if (!pub || !this.podeCancelar() || this.cancelando()) return;
    const confirmado = await this.confirm.confirm({
      title: 'Cancelar a geração?',
      message: `A geração da versão ${pub.versao} será interrompida e o pacote descartado. `
        + 'O cancelamento não é imediato: o worker termina a etapa atual antes de parar.',
      acceptLabel: 'Cancelar geração',
      variant: 'danger',
      icon: 'CircleX',
    });
    if (!confirmado) return;

    this.cancelando.set(true);
    this.publicacaoService.cancelarPublicacao(this.id).subscribe({
      next: atualizada => {
        this.publicacao.set(atualizada);
        this.cancelando.set(false);
        this.toast.success('Cancelamento solicitado. A publicação será encerrada em instantes.');
      },
      error: () => {
        this.cancelando.set(false);
        this.toast.error('Não foi possível cancelar a geração.');
      },
    });
  }

  /** A comparação é carregada só quando a aba é aberta. */
  protected selecionarTab(tab: PublicacaoDetalheTab): void {
    this.activeTab.set(tab);
    if (tab === 'comparar' && !this.diff() && !this.erroDiff()) this.carregarDiff();
  }

  carregarDiff(comparadaCom?: string): void {
    if (this.carregandoDiff()) return;
    this.carregandoDiff.set(true);
    this.erroDiff.set(null);
    this.publicacaoService.diffPublicacao(this.id, comparadaCom).subscribe({
      next: resultado => {
        this.diff.set(resultado);
        this.carregandoDiff.set(false);
      },
      error: (erro: { error?: { message?: string } }) => {
        this.diff.set(null);
        this.carregandoDiff.set(false);
        this.erroDiff.set(
          erro?.error?.message ?? 'Não foi possível comparar com a publicação anterior.',
        );
      },
    });
  }

  /**
   * Compara o HTML da página nas duas publicações. Só faz sentido para o que
   * mudou de fato — o botão só aparece em ALTERADA.
   */
  compararConteudo(item: PublicacaoDiffItem): void {
    const diff = this.diff();
    if (!diff || this.carregandoConteudo()) return;
    this.paginaComparada.set(item);
    this.carregandoConteudo.set(true);
    this.linhasConteudo.set([]);
    forkJoin({
      anterior: this.publicacaoService
        .htmlDaPaginaPublicada(diff.comparadaComId, item.paginaId)
        .pipe(catchError(() => of(''))),
      atual: this.publicacaoService
        .htmlDaPaginaPublicada(diff.publicacaoId, item.paginaId)
        .pipe(catchError(() => of(''))),
    }).subscribe({
      next: async ({ anterior, atual }) => {
        this.linhasConteudo.set(await diffLinhasPalavras(anterior, atual));
        this.carregandoConteudo.set(false);
      },
      error: () => {
        this.carregandoConteudo.set(false);
        this.toast.error('Não foi possível carregar o conteúdo arquivado da página.');
      },
    });
  }

  fecharComparacao(): void {
    this.paginaComparada.set(null);
    this.linhasConteudo.set([]);
  }

  itensDaMudanca(mudanca: MudancaPublicacao) {
    return this.diff()?.itens.filter(item => item.mudanca === mudanca) ?? [];
  }

  totalDaMudanca(mudanca: MudancaPublicacao): number {
    return this.diff()?.totaisPorMudanca?.[mudanca] ?? 0;
  }

  podeBaixar(): boolean {
    const pub = this.publicacao();
    return !!pub && pub.status === 'SUCESSO' && !!pub.arquivoZipNome;
  }

  baixarZip(): void {
    const pub = this.publicacao();
    if (!pub || !this.podeBaixar() || this.baixandoZip()) return;
    this.baixandoZip.set(true);
    this.publicacaoService.baixarPublicacao(this.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = pub.arquivoZipNome ?? `manual-${pub.versao}.zip`;
        link.click();
        URL.revokeObjectURL(url);
        this.baixandoZip.set(false);
      },
      error: () => {
        this.baixandoZip.set(false);
        this.toast.error('Erro ao baixar pacote ZIP.');
      },
    });
  }

  baixarPdf(): void {
    const pub = this.publicacao();
    if (!pub || pub.status !== 'SUCESSO' || this.baixandoPdf()) return;
    this.baixandoPdf.set(true);
    this.publicacaoService.baixarPdf(this.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `manual-${pub.versao}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.baixandoPdf.set(false);
      },
      error: () => {
        this.baixandoPdf.set(false);
        this.toast.error('Erro ao baixar PDF.');
      },
    });
  }

  copiarLink(): void {
    const pub = this.publicacao();
    if (!pub || pub.status !== 'SUCESSO') return;
    this.publicacaoService.tokenDownloadPacote(this.id).subscribe({
      next: t => {
        const url = this.publicacaoService.montarUrlDownloadPacotePublico(t.token, t.urlPath);
        navigator.clipboard
          .writeText(url)
          .then(() => {
            this.toast.success(`Link público temporário copiado (válido ${t.validadeSegundos}s).`);
          })
          .catch(() => this.toast.error('Não foi possível copiar o link.'));
      },
      error: () => this.toast.error('Erro ao gerar link público.'),
    });
  }

  async excluir(): Promise<void> {
    const pub = this.publicacao();
    if (!pub || pub.status === 'GERANDO' || this.excluindo()) return;
    const confirmado = await this.confirm.confirm({
      title: 'Excluir publicação?',
      message: `A publicação ${pub.versao} de ${pub.clienteNome}, seu histórico e o pacote ZIP serão excluídos permanentemente.`,
      acceptLabel: 'Excluir publicação',
      variant: 'danger',
      icon: 'Trash2',
    });
    if (!confirmado) return;

    this.excluindo.set(true);
    this.publicacaoService.excluirPublicacao(this.id).subscribe({
      next: () => {
        this.toast.success('Publicação excluída.');
        void this.router.navigate(docFlowRouterCommands(['publicacoes']));
      },
      error: () => {
        this.excluindo.set(false);
        this.toast.error('Erro ao excluir publicação.');
      },
    });
  }

  changelogPorTipo(tipo: string): ChangelogItem[] {
    return this.changelog().filter(c => c.tipoMudanca === tipo);
  }

  voltar(): void {
    void this.router.navigate(docFlowRouterCommands(['publicacoes']));
  }

  imprimir(): void {
    window.print();
  }

  private montarHierarquiaSnapshot(
    lista: PublicacaoPaginaSnapshot[],
    changelogPorPagina: Map<string, ChangelogItem['tipoMudanca']>,
  ): PaginaArvoreItem[] {
    const filhos = new Map<string, PublicacaoPaginaSnapshot[]>();
    const ids = new Set(lista.map(pagina => pagina.id));
    lista.forEach(pagina => {
      if (pagina.parentId) {
        filhos.set(pagina.parentId, [...(filhos.get(pagina.parentId) ?? []), pagina]);
      }
    });
    filhos.forEach(items => items.sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo)));
    const roots = lista
      .filter(pagina => !pagina.parentId || !ids.has(pagina.parentId))
      .sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo));
    const ordenadas: PaginaArvoreItem[] = [];
    const append = (pagina: PublicacaoPaginaSnapshot, nivel: number) => {
      ordenadas.push({
        id: pagina.id,
        titulo: pagina.titulo,
        codigoTela: pagina.codigoTela,
        nivel,
        tipoMudanca: changelogPorPagina.get(pagina.id),
      });
      (filhos.get(pagina.id) ?? []).forEach(filho => append(filho, nivel + 1));
    };
    roots.forEach(pagina => append(pagina, 0));
    return ordenadas;
  }

  private tryParse(raw?: string): Record<string, unknown> | null {
    if (!raw?.trim()) return null;
    try {
      const o = JSON.parse(raw) as unknown;
      return o && typeof o === 'object' ? (o as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}
