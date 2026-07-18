import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Publicacao } from '@modules/docflow/models/publicacao.model';
import { ChangelogItem } from '@modules/docflow/models/pagina.model';
import {
  PageHeaderComponent,
  ButtonComponent,
  CardComponent,
  BadgeComponent,
  ConfirmService,
  ToastService,
} from '@shared/ui';
import { PermissaoDirective } from '@modules/seguranca/directives';

@Component({
  selector: 'app-publicacao-detalhe',
  standalone: true,
  imports: [
    DatePipe,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    BadgeComponent,
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
  protected readonly relatorioJson = signal<Record<string, unknown> | null>(null);
  protected readonly excluindo = signal(false);
  readonly mudancaTipos = ['ADICIONADO', 'ATUALIZADO', 'REMOVIDO'] as const;

  protected readonly avisosValidacao = computed<string[]>(() => {
    const raw = this.relatorioJson()?.['avisos'];
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is string => typeof item === 'string');
  });

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
      },
      error: () => this.toast.error('Não foi possível carregar a publicação.'),
    });
  }

  copiarLink(): void {
    const pub = this.publicacao();
    if (!pub || pub.status !== 'SUCESSO') return;
    this.publicacaoService.tokenDownloadPacote(this.id).subscribe({
      next: t => {
        const url = this.publicacaoService.montarUrlDownloadPacotePublico(t.token);
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
