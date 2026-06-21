import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Release, RELEASE_STATUS_LABELS, RELEASE_TIPO_LABELS } from '../../models/release.model';
import { ReleaseService } from '../../services/release.service';
import {
  Entrega,
  STATUS_ENTREGA_LABELS,
  STATUS_ENTREGA_TONES,
} from '../../models/entrega.model';
import {
  ProximaEntrega,
  STATUS_PE_LABELS,
  STATUS_PE_TONES,
} from '../../models/proxima-entrega.model';
import { EntregaService } from '../../services/entrega.service';
import { ProximaEntregaService } from '../../services/proxima-entrega.service';
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
  protected readonly entregasRecentes = signal<Entrega[]>([]);
  protected readonly proximasEntregas = signal<ProximaEntrega[]>([]);

  protected readonly statusLabels = RELEASE_STATUS_LABELS;
  protected readonly tipoLabels = RELEASE_TIPO_LABELS;
  protected readonly statusEntregaLabels = STATUS_ENTREGA_LABELS;
  protected readonly statusEntregaTones = STATUS_ENTREGA_TONES;
  protected readonly statusPeLabels = STATUS_PE_LABELS;
  protected readonly statusPeTones = STATUS_PE_TONES;

  protected readonly indicadores = signal<Indicador[]>([
    { label: 'Releases publicadas', valor: 0, icon: 'CheckCircle', cor: 'green' },
    { label: 'Em revisão', valor: 0, icon: 'Clock', cor: 'amber' },
    { label: 'Em desenvolvimento', valor: 0, icon: 'Code', cor: 'blue' },
    { label: 'Itens registrados', valor: 0, icon: 'List', cor: 'purple' },
  ]);

  protected readonly kpisEntregas = signal<Indicador[]>([
    { label: 'Em geração', valor: 0, icon: 'Loader', cor: 'blue' },
    { label: 'Concluídas (recentes)', valor: 0, icon: 'CheckCircle', cor: 'green' },
    { label: 'Falhas (recentes)', valor: 0, icon: 'AlertTriangle', cor: 'red' },
    { label: 'Atrasadas', valor: 0, icon: 'CalendarX', cor: 'amber' },
  ]);

  constructor(
    private readonly releaseService: ReleaseService,
    private readonly entregaService: EntregaService,
    private readonly proximaService: ProximaEntregaService,
  ) {}

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
      entregasRecentes: this.entregaService
        .listar(1, 5)
        .pipe(catchError(() => of({ items: [] as Entrega[], totalItems: 0, page: 1, size: 5 }))),
      emGeracao: this.entregaService
        .listar(1, 1, { status: 'EM_GERACAO' })
        .pipe(catchError(() => of({ items: [] as Entrega[], totalItems: 0, page: 1, size: 1 }))),
      concluidas: this.entregaService
        .listar(1, 1, { status: 'CONCLUIDA' })
        .pipe(catchError(() => of({ items: [] as Entrega[], totalItems: 0, page: 1, size: 1 }))),
      falhas: this.entregaService
        .listar(1, 1, { status: 'FALHA' })
        .pipe(catchError(() => of({ items: [] as Entrega[], totalItems: 0, page: 1, size: 1 }))),
      proximas: this.proximaService
        .listar(1, 50)
        .pipe(catchError(() => of({ items: [] as ProximaEntrega[], totalItems: 0, page: 1, size: 50 }))),
    }).subscribe({
      next: ({
        recentes, publicadas, emRevisao, emDesenvolvimento,
        entregasRecentes, emGeracao, concluidas, falhas, proximas,
      }) => {
        this.releasesRecentes.set(recentes.items ?? []);
        this.entregasRecentes.set(entregasRecentes.items ?? []);

        const ativas = (proximas.items ?? []).filter(
          pe => pe.status !== 'CONVERTIDA' && pe.status !== 'CANCELADA',
        );
        const hoje = new Date().toISOString().slice(0, 10);
        const atrasadas = ativas.filter(pe => pe.dataPrevista < hoje).length;
        const proximasOrdenadas = [...ativas]
          .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))
          .slice(0, 5);
        this.proximasEntregas.set(proximasOrdenadas);

        this.indicadores.set([
          { label: 'Releases publicadas', valor: publicadas.totalItems, icon: 'CheckCircle', cor: 'green' },
          { label: 'Em revisão', valor: emRevisao.totalItems, icon: 'Clock', cor: 'amber' },
          { label: 'Em desenvolvimento', valor: emDesenvolvimento.totalItems, icon: 'Code', cor: 'blue' },
          { label: 'Itens registrados', valor: recentes.totalItems, icon: 'List', cor: 'purple' },
        ]);

        this.kpisEntregas.set([
          { label: 'Em geração', valor: emGeracao.totalItems, icon: 'Loader', cor: 'blue' },
          { label: 'Concluídas', valor: concluidas.totalItems, icon: 'CheckCircle', cor: 'green' },
          { label: 'Falhas', valor: falhas.totalItems, icon: 'AlertTriangle', cor: 'red' },
          { label: 'Atrasadas', valor: atrasadas, icon: 'CalendarX', cor: 'amber' },
        ]);

        this.loading.set(false);
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar o dashboard. Verifique se a API está em execução.');
        this.releasesRecentes.set([]);
        this.entregasRecentes.set([]);
        this.proximasEntregas.set([]);
        this.loading.set(false);
      },
    });
  }

  protected estaAtrasada(pe: ProximaEntrega): boolean {
    const hoje = new Date().toISOString().slice(0, 10);
    return pe.dataPrevista < hoje;
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
