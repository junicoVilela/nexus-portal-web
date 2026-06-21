import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin, of, Subscription, timer } from 'rxjs';
import { catchError, switchMap, takeWhile } from 'rxjs/operators';

import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ErrorVariant,
  KpiCardComponent,
  SkeletonComponent,
  TabItem,
  TabsComponent,
  ToastService,
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';

import { AMBIENTE_LABELS } from '../../../models/cliente.model';
import {
  Entrega,
  formatarTamanho,
  STATUS_ENTREGA_LABELS,
  STATUS_ENTREGA_TONES,
} from '../../../models/entrega.model';
import {
  DeltaResumo,
  EntregaModulo,
  EntregaModuloArtefato,
  TIPO_MODULO_LABELS,
  TIPO_MODULO_TONES,
} from '../../../models/entrega-modulo.model';
import { EntregaService } from '../../../services/entrega.service';
import { EntregaModuloService } from '../../../services/entrega-modulo.service';

type Aba = 'geral' | 'modulos' | 'delta';

const POLL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-entrega-detalhe',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    LucideAngularModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    KpiCardComponent,
    SkeletonComponent,
    TabsComponent,
  ],
  templateUrl: './entrega-detalhe.component.html',
  styleUrl: './entrega-detalhe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregaDetalheComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EntregaService);
  private readonly moduloService = inject(EntregaModuloService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly entrega = signal<Entrega | null>(null);
  protected readonly modulos = signal<EntregaModulo[]>([]);
  protected readonly artefatos = signal<EntregaModuloArtefato[]>([]);
  protected readonly resumoDelta = signal<DeltaResumo | null>(null);
  protected readonly activeTab = signal<Aba>('geral');
  protected readonly iniciandoGeracao = signal(false);
  protected readonly cancelando = signal(false);
  protected readonly reentregando = signal(false);
  protected readonly baixandoDoc = signal(false);
  protected readonly emPolling = signal(false);

  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly statusLabels = STATUS_ENTREGA_LABELS;
  protected readonly statusTones = STATUS_ENTREGA_TONES;
  protected readonly tipoModuloLabels = TIPO_MODULO_LABELS;
  protected readonly tipoModuloTones = TIPO_MODULO_TONES;
  protected readonly formatarTamanho = formatarTamanho;

  protected readonly modulosSelecionados = computed(
    () => this.modulos().filter(m => m.selecionado).length,
  );

  protected readonly modulosOrdenados = computed(() =>
    [...this.modulos()].sort((a, b) => a.ordem - b.ordem),
  );

  protected readonly tabsConfig = computed<TabItem<Aba>[]>(() => [
    { id: 'geral', label: 'Visão geral', icon: 'LayoutDashboard' },
    { id: 'modulos', label: 'Módulos', icon: 'Boxes', count: this.modulos().length },
    { id: 'delta', label: 'Delta', icon: 'Layers', count: this.artefatos().length },
  ]);

  private entregaId!: string;
  private pollingSub?: Subscription;

  ngOnInit(): void {
    this.entregaId = this.route.snapshot.paramMap.get('id') ?? '';
    const tab = (this.route.snapshot.queryParamMap.get('tab') ?? 'geral') as Aba;
    this.activeTab.set(tab);
    this.carregar();
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    forkJoin({
      entrega: this.service.buscar(this.entregaId),
      modulos: this.moduloService.listarModulos(this.entregaId).pipe(catchError(() => of([]))),
      artefatos: this.moduloService.listarDelta(this.entregaId).pipe(catchError(() => of([]))),
      resumo: this.moduloService
        .resumoDelta(this.entregaId)
        .pipe(catchError(() => of(null as DeltaResumo | null))),
    }).subscribe({
      next: ({ entrega, modulos, artefatos, resumo }) => {
        this.entrega.set(entrega);
        this.modulos.set(modulos);
        this.artefatos.set(artefatos);
        this.resumoDelta.set(resumo);
        this.loading.set(false);
        if (entrega.status === 'EM_GERACAO') this.iniciarPolling();
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Não foi possível carregar a entrega.');
        this.loading.set(false);
      },
    });
  }

  private iniciarPolling(): void {
    if (this.emPolling()) return;
    this.emPolling.set(true);
    this.pollingSub?.unsubscribe();
    this.pollingSub = timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.service.buscar(this.entregaId)),
        takeWhile(e => e.status === 'EM_GERACAO', true),
      )
      .subscribe({
        next: e => {
          this.entrega.set(e);
          if (e.status !== 'EM_GERACAO') {
            this.emPolling.set(false);
            this.recarregarArtefatos();
            if (e.status === 'CONCLUIDA') this.toast.success('Geração concluída.');
            else if (e.status === 'FALHA') this.toast.error('Geração falhou.');
          }
        },
        error: () => this.emPolling.set(false),
      });
  }

  private recarregarArtefatos(): void {
    this.moduloService
      .listarDelta(this.entregaId)
      .pipe(catchError(() => of([])))
      .subscribe(a => this.artefatos.set(a));
    this.moduloService
      .resumoDelta(this.entregaId)
      .pipe(catchError(() => of(null as DeltaResumo | null)))
      .subscribe(r => this.resumoDelta.set(r));
  }

  protected mudarAba(aba: Aba): void {
    this.activeTab.set(aba);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: aba },
      queryParamsHandling: 'merge',
    });
  }

  protected iniciarGeracao(): void {
    this.iniciandoGeracao.set(true);
    this.service.iniciarGeracao(this.entregaId).subscribe({
      next: e => {
        this.entrega.set(e);
        this.iniciandoGeracao.set(false);
        this.toast.success('Geração iniciada. Acompanhando…');
        this.iniciarPolling();
      },
      error: () => {
        this.iniciandoGeracao.set(false);
        this.toast.error('Não foi possível iniciar a geração.');
      },
    });
  }

  protected cancelar(): void {
    this.cancelando.set(true);
    this.service.cancelar(this.entregaId).subscribe({
      next: e => {
        this.entrega.set(e);
        this.cancelando.set(false);
        this.pollingSub?.unsubscribe();
        this.emPolling.set(false);
        this.toast.success('Entrega cancelada.');
      },
      error: () => {
        this.cancelando.set(false);
        this.toast.error('Não foi possível cancelar.');
      },
    });
  }

  protected reentregar(): void {
    this.reentregando.set(true);
    this.service.reentregar(this.entregaId).subscribe({
      next: nova => {
        this.reentregando.set(false);
        this.toast.success('Reentrega criada.');
        this.router.navigate(['/release-orchestrator/entregas', nova.id]);
      },
      error: () => {
        this.reentregando.set(false);
        this.toast.error('Não foi possível criar a reentrega.');
      },
    });
  }

  protected baixarDocumento(): void {
    this.baixandoDoc.set(true);
    this.moduloService.baixarDocumento(this.entregaId).subscribe({
      next: blob => {
        const e = this.entrega();
        const nome = e
          ? `documento-${e.clienteSigla.toLowerCase()}-${e.produtoSigla.toLowerCase()}-${e.releaseVersao}.pdf`
          : 'documento.pdf';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nome;
        a.click();
        URL.revokeObjectURL(url);
        this.baixandoDoc.set(false);
      },
      error: () => {
        this.baixandoDoc.set(false);
        this.toast.error('Não foi possível baixar o documento.');
      },
    });
  }
}
