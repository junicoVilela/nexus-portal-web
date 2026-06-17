import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Release, RELEASE_STATUS_LABELS, RELEASE_TIPO_LABELS } from '../../../models/release.model';
import { ReleaseItem, CATEGORIA_LABELS, CATEGORIAS_ORDENADAS } from '../../../models/release-item.model';
import { ReleaseService, RevisaoValidacao } from '../../../services/release.service';
import { ReleaseItemService } from '../../../services/release-item.service';
import { ReleasePdfService } from '../../../services/release-pdf.service';

import { LucideAngularModule } from 'lucide-angular';
import {
  PageHeaderComponent,
  CardComponent,
  ButtonComponent,
  ErrorStateComponent,
  ErrorVariant,
  NotificationService,
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';

@Component({
  selector: 'app-release-revisao',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './release-revisao.component.html',
  styleUrl: './release-revisao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseRevisaoComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly publicando = signal(false);
  protected readonly release = signal<Release | null>(null);
  protected readonly itens = signal<ReleaseItem[]>([]);
  protected readonly validacao = signal<RevisaoValidacao | null>(null);

  protected readonly statusLabels = RELEASE_STATUS_LABELS;
  protected readonly tipoLabels = RELEASE_TIPO_LABELS;
  protected readonly categoriaLabels = CATEGORIA_LABELS;

  protected readonly itensPorCategoria = computed(() => {
    const lista = this.itens();
    return CATEGORIAS_ORDENADAS.map(cat => ({
      categoria: cat,
      label: this.categoriaLabels[cat],
      itens: lista.filter(i => i.categoria === cat),
    })).filter(g => g.itens.length > 0);
  });

  private releaseId!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly releaseService: ReleaseService,
    private readonly itemService: ReleaseItemService,
    private readonly pdfService: ReleasePdfService,
  ) {}

  ngOnInit(): void {
    this.releaseId = this.route.snapshot.paramMap.get('id')!;
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this.releaseService.buscarPorId(this.releaseId).subscribe({
      next: rel => {
        this.release.set(rel);
        this.carregarItens();
        this.carregarValidacao();
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Release não encontrada ou erro ao carregar.');
        this.release.set(null);
        this.itens.set([]);
        this.validacao.set(null);
        this.loading.set(false);
      },
    });
  }

  private carregarItens(): void {
    this.itemService.listar(this.releaseId).subscribe({
      next: itens => {
        this.itens.set(itens);
        this.loading.set(false);
      },
      error: () => {
        this.itens.set([]);
        this.loading.set(false);
      },
    });
  }

  private carregarValidacao(): void {
    this.releaseService.validarRevisao(this.releaseId).subscribe({
      next: v => this.validacao.set(v),
      error: () => this.validacao.set(null),
    });
  }

  private readonly notifications = inject(NotificationService);

  protected publicar(): void {
    if (!this.validacao()?.valida) return;
    this.publicando.set(true);
    this.releaseService.publicar(this.releaseId).subscribe({
      next: () => {
        const rel = this.release();
        if (rel) {
          this.notifications.add('success', `Release ${rel.versao} publicada`, {
            description: rel.titulo,
            href: `/release-orchestrator/releases/${this.releaseId}`,
          });
        }
        this.router.navigate(['/release-orchestrator/releases', this.releaseId]);
      },
      error: () => this.publicando.set(false),
    });
  }

  protected gerarPdf(): void {
    const rel = this.release();
    if (!rel) return;
    this.pdfService.download(this.releaseId, 'INTERNO', `${rel.produtoSigla}-${rel.versao}.pdf`);
  }

  protected getStatusTone(status: string): 'success' | 'warn' | 'danger' | 'neutral' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'neutral'> = {
      RASCUNHO: 'neutral',
      EM_DESENVOLVIMENTO: 'neutral',
      EM_REVISAO: 'warn',
      APROVADA: 'success',
      PUBLICADA: 'success',
      CANCELADA: 'danger',
    };
    return map[status] ?? 'neutral';
  }
}
