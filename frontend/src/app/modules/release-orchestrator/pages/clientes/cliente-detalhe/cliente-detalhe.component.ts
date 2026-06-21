import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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

import {
  AMBIENTE_LABELS,
  Cliente,
  ConfigEntrega,
  Contato,
  PAPEL_CONTATO_LABELS,
  TIPO_BANCO_LABELS,
  TIPO_DESTINO_LABELS,
} from '../../../models/cliente.model';
import {
  PRIORIDADE_LABELS,
  PRIORIDADE_TONES,
  ProximaEntrega,
  STATUS_PE_LABELS,
  STATUS_PE_TONES,
} from '../../../models/proxima-entrega.model';
import { ClienteService } from '../../../services/cliente.service';
import { ContatoService } from '../../../services/contato.service';
import { ConfigEntregaService } from '../../../services/config-entrega.service';
import { ProximaEntregaService } from '../../../services/proxima-entrega.service';

type Aba = 'geral' | 'contatos' | 'config-entrega' | 'proximas-entregas';

@Component({
  selector: 'app-cliente-detalhe',
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
  templateUrl: './cliente-detalhe.component.html',
  styleUrl: './cliente-detalhe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteDetalheComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clienteService = inject(ClienteService);
  private readonly contatoService = inject(ContatoService);
  private readonly configService = inject(ConfigEntregaService);
  private readonly proximaService = inject(ProximaEntregaService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly alternandoStatus = signal(false);

  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly contatos = signal<Contato[]>([]);
  protected readonly config = signal<ConfigEntrega | null>(null);
  protected readonly proximasEntregas = signal<ProximaEntrega[]>([]);

  protected readonly activeTab = signal<Aba>('geral');

  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly bancoLabels = TIPO_BANCO_LABELS;
  protected readonly papelLabels = PAPEL_CONTATO_LABELS;
  protected readonly destinoLabels = TIPO_DESTINO_LABELS;
  protected readonly statusPeLabels = STATUS_PE_LABELS;
  protected readonly statusPeTones = STATUS_PE_TONES;
  protected readonly prioridadeLabels = PRIORIDADE_LABELS;
  protected readonly prioridadeTones = PRIORIDADE_TONES;

  protected readonly tabsConfig = computed<TabItem<Aba>[]>(() => [
    { id: 'geral', label: 'Visão geral', icon: 'LayoutDashboard' },
    { id: 'contatos', label: 'Contatos', icon: 'Users', count: this.contatos().length },
    { id: 'config-entrega', label: 'Config. entrega', icon: 'Settings' },
    {
      id: 'proximas-entregas',
      label: 'Próximas entregas',
      icon: 'CalendarClock',
      count: this.proximasEntregas().length,
    },
  ]);

  protected readonly proximaEntregaPendente = computed(() => {
    const ativas = this.proximasEntregas().filter(
      pe => pe.status !== 'CONVERTIDA' && pe.status !== 'CANCELADA',
    );
    return [...ativas].sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))[0] ?? null;
  });

  protected readonly cnpjFormatado = computed(() => {
    const raw = this.cliente()?.cnpj;
    if (!raw || raw.length !== 14) return raw ?? '';
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
  });

  private clienteId!: string;

  ngOnInit(): void {
    this.clienteId = this.route.snapshot.paramMap.get('id') ?? '';
    const tab = (this.route.snapshot.queryParamMap.get('tab') ?? 'geral') as Aba;
    this.activeTab.set(tab);
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    forkJoin({
      cliente: this.clienteService.buscar(this.clienteId),
      contatos: this.contatoService.listar(this.clienteId),
      config: this.configService.buscar(this.clienteId).pipe(catchError(() => of(null))),
      proximas: this.proximaService
        .listar(1, 20, { clienteId: this.clienteId })
        .pipe(catchError(() => of({ items: [] as ProximaEntrega[], total: 0, page: 1, size: 20 }))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ cliente, contatos, config, proximas }) => {
          this.cliente.set(cliente);
          this.contatos.set(contatos);
          this.config.set(config);
          this.proximasEntregas.set(proximas.items ?? []);
        },
        error: err => {
          this.erroVariant.set(classificarErro(err));
          this.erro.set('Não foi possível carregar o cliente. Tente recarregar.');
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

  protected alternarStatus(): void {
    const c = this.cliente();
    if (!c) return;
    const novo = !c.ativo;
    this.alternandoStatus.set(true);
    this.clienteService
      .alterarStatus(c.id, novo)
      .pipe(finalize(() => this.alternandoStatus.set(false)))
      .subscribe({
        next: atualizado => {
          this.cliente.set(atualizado);
          this.toast.success(novo ? 'Cliente reativado.' : 'Cliente pausado.');
        },
        error: () => this.toast.error('Não foi possível alterar o status.'),
      });
  }
}
