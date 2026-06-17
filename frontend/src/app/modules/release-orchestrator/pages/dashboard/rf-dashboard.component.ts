import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Release, RELEASE_STATUS_LABELS, RELEASE_TIPO_LABELS } from '../../models/release.model';
import { ReleaseService } from '../../services/release.service';
import { LucideAngularModule } from 'lucide-angular';
import {
  PageHeaderComponent,
  CardComponent,
  ButtonComponent,
  BadgeComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ErrorVariant,
  KpiCardComponent,
  type KpiTone,
  SkeletonComponent,
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';

interface Indicador {
  label: string;
  valor: number | string;
  icon: string;
  cor: KpiTone;
}

@Component({
  selector: 'app-rf-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
    KpiCardComponent,
  ],
  templateUrl: './rf-dashboard.component.html',
  styleUrl: './rf-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfDashboardComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly releasesRecentes = signal<Release[]>([]);

  protected readonly statusLabels = RELEASE_STATUS_LABELS;
  protected readonly tipoLabels = RELEASE_TIPO_LABELS;

  protected readonly indicadores = signal<Indicador[]>([
    { label: 'Releases publicadas', valor: 0, icon: 'CheckCircle', cor: 'green' },
    { label: 'Em revisão', valor: 0, icon: 'Clock', cor: 'amber' },
    { label: 'Em desenvolvimento', valor: 0, icon: 'Code', cor: 'blue' },
    { label: 'Itens registrados', valor: 0, icon: 'List', cor: 'purple' },
  ]);

  constructor(private readonly releaseService: ReleaseService) {}

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    forkJoin({
      recentes: this.releaseService.listar({ page: 1, size: 8, sort: 'updatedAt', direction: 'DESC' }),
      publicadas: this.releaseService.listar({ page: 1, size: 1, status: 'PUBLICADA' }),
      emRevisao: this.releaseService.listar({ page: 1, size: 1, status: 'EM_REVISAO' }),
      emDesenvolvimento: this.releaseService.listar({ page: 1, size: 1, status: 'EM_DESENVOLVIMENTO' }),
    }).subscribe({
      next: ({ recentes, publicadas, emRevisao, emDesenvolvimento }) => {
        this.releasesRecentes.set(recentes.items ?? []);
        this.indicadores.set([
          { label: 'Releases publicadas', valor: publicadas.totalItems, icon: 'CheckCircle', cor: 'green' },
          { label: 'Em revisão', valor: emRevisao.totalItems, icon: 'Clock', cor: 'amber' },
          { label: 'Em desenvolvimento', valor: emDesenvolvimento.totalItems, icon: 'Code', cor: 'blue' },
          { label: 'Itens registrados', valor: recentes.totalItems, icon: 'List', cor: 'purple' },
        ]);
        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar o dashboard. Verifique se a API está em execução.');
        this.releasesRecentes.set([]);
        this.loading.set(false);
      },
    });
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
