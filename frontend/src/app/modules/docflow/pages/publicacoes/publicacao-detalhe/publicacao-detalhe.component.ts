import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Publicacao } from '@modules/docflow/models/publicacao.model';
import { ChangelogItem, Pagina } from '@modules/docflow/models/pagina.model';
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
import { PermissaoDirective } from '@modules/seguranca/directives';

type PublicacaoDetalheTab = 'visao-geral' | 'paginas' | 'changelog' | 'downloads';

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
  protected readonly paginasPreview = signal<Pagina[]>([]);
  protected readonly relatorioJson = signal<Record<string, unknown> | null>(null);
  protected readonly excluindo = signal(false);
  protected readonly baixandoZip = signal(false);
  protected readonly baixandoPdf = signal(false);
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
    const preview = this.paginasPreview();
    const changelogPorPagina = new Map<string, ChangelogItem['tipoMudanca']>();
    for (const item of this.changelog()) {
      if (item.paginaId) changelogPorPagina.set(item.paginaId, item.tipoMudanca);
    }

    if (preview.length) {
      return this.montarHierarquiaPaginas(preview, changelogPorPagina);
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
    }).subscribe({
      next: ({ publicacao, changelog }) => {
        this.publicacao.set(publicacao);
        this.relatorioJson.set(this.tryParse(publicacao.relatorioValidacao));
        this.changelog.set(changelog);
        this.publicacaoService
          .previewPublicacao(publicacao.clienteId)
          .pipe(catchError(() => of([] as Pagina[])))
          .subscribe(paginas => this.paginasPreview.set(paginas));
      },
      error: () => this.toast.error('Não foi possível carregar a publicação.'),
    });
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

  private montarHierarquiaPaginas(
    lista: Pagina[],
    changelogPorPagina: Map<string, ChangelogItem['tipoMudanca']>,
  ): PaginaArvoreItem[] {
    const filhos = new Map<string, Pagina[]>();
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
    const append = (pagina: Pagina, nivel: number) => {
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
