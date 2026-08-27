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
  STATUS_PUBLICACAO_LABELS,
  STATUS_PUBLICACAO_TONES,
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
import { DeployInstalacaoService } from '../../../services/deploy-instalacao.service';
import { AuthService } from '@core/auth/services/auth.service';
import {
  DeployInstalacao,
  ModoDeploy,
  OPERACAO_DEPLOY_LABELS,
  STATUS_DEPLOY_LABELS,
  STATUS_DEPLOY_TONES,
} from '../../../models/deploy-instalacao.model';

type Aba = 'geral' | 'modulos' | 'delta' | 'implantacao';

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
  private readonly deployService = inject(DeployInstalacaoService);
  private readonly auth = inject(AuthService);
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
  protected readonly baixandoZip = signal(false);
  protected readonly emPolling = signal(false);
  protected readonly deploys = signal<DeployInstalacao[]>([]);
  protected readonly executandoDeployId = signal<string | null>(null);
  protected readonly executandoLote = signal(false);
  protected readonly podeDeployar = computed(() => this.auth.tem()('INSTALACAO:EDITAR'));
  protected readonly statusDeployLabels = STATUS_DEPLOY_LABELS;
  protected readonly statusDeployTones = STATUS_DEPLOY_TONES;
  protected readonly operacaoDeployLabels = OPERACAO_DEPLOY_LABELS;

  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly statusLabels = STATUS_ENTREGA_LABELS;
  protected readonly statusTones = STATUS_ENTREGA_TONES;
  protected readonly statusPubLabels = STATUS_PUBLICACAO_LABELS;
  protected readonly statusPubTones = STATUS_PUBLICACAO_TONES;
  protected readonly reagendandoPub = signal(false);
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
    { id: 'implantacao', label: 'Implantação', icon: 'Rocket', count: this.entrega()?.instalacoes?.length ?? 0 },
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
        this.carregarDeploys();
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

  private carregarDeploys(): void {
    this.deployService
      .listar(1, 50, { entregaId: this.entregaId })
      .pipe(catchError(() => of({ items: [] as DeployInstalacao[] })))
      .subscribe(r => this.deploys.set(r.items ?? []));
  }

  protected ultimoDeploy(instalacaoId: string): DeployInstalacao | undefined {
    return this.deploys().find(d => d.instalacaoId === instalacaoId);
  }

  protected executarDeploy(instalacaoId: string, modo: ModoDeploy, forcar = false): void {
    const e = this.entrega();
    if (!e) return;
    this.executandoDeployId.set(instalacaoId);
    this.deployService
      .executar({ releaseId: e.releaseId, instalacaoId, entregaId: e.id, forcar, modo })
      .subscribe({
        next: d => {
          this.executandoDeployId.set(null);
          if (d.status === 'IGNORADO') {
            this.toast.info(d.mensagem ?? 'Manifesto já aplicado.');
          } else if (d.status === 'FALHA') {
            this.toast.error(d.erro ?? 'Falha na implantação.');
          } else if (modo === 'REAL') {
            this.toast.success(d.mensagem ?? 'Instalação aplicada no host.');
            this.carregar();
          } else {
            this.toast.success(d.mensagem ?? 'Dry-run concluído. O host não foi alterado.');
          }
          this.carregarDeploys();
        },
        error: err => {
          this.executandoDeployId.set(null);
          const msg = err?.error?.message ?? 'Não foi possível implantar.';
          this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível implantar.');
        },
      });
  }

  protected executarLote(modo: ModoDeploy): void {
    this.executandoLote.set(true);
    this.deployService.executarLote(this.entregaId, modo).subscribe({
      next: r => {
        this.executandoLote.set(false);
        const partes = [`${r.concluidos} concluído(s)`, `${r.falhas} falha(s)`, `${r.ignorados} ignorado(s)`];
        if (r.falhas > 0) {
          this.toast.error(`Lote: ${partes.join(', ')}.`);
        } else {
          this.toast.success(`Lote: ${partes.join(', ')}.`);
        }
        this.carregar();
        this.carregarDeploys();
      },
      error: err => {
        this.executandoLote.set(false);
        const msg = err?.error?.message ?? 'Não foi possível implantar o lote.';
        this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível implantar o lote.');
      },
    });
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

  protected reagendarPublicacao(): void {
    this.reagendandoPub.set(true);
    this.service.reagendarPublicacao(this.entregaId).subscribe({
      next: e => {
        this.entrega.set(e);
        this.reagendandoPub.set(false);
        this.toast.success('Publicação reagendada — o job tenta na próxima execução.');
      },
      error: err => {
        this.reagendandoPub.set(false);
        const msg = err?.error?.message ?? err?.error;
        this.toast.error(typeof msg === 'string' ? msg : 'Não foi possível reagendar.');
      },
    });
  }

  protected baixarPacote(): void {
    this.baixandoZip.set(true);
    this.service.baixarPacote(this.entregaId).subscribe({
      next: blob => {
        const e = this.entrega();
        const nome = e
          ? `pacote-${e.clienteSigla.toLowerCase()}-${e.produtoSigla.toLowerCase()}-${e.releaseVersao}.zip`
          : 'pacote.zip';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nome;
        a.click();
        URL.revokeObjectURL(url);
        this.baixandoZip.set(false);
      },
      error: () => {
        this.baixandoZip.set(false);
        this.toast.error('Não foi possível baixar o pacote.');
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
