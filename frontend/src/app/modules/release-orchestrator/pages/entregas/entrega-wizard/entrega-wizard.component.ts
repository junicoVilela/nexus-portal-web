import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  SkeletonComponent,
  ToastService,
} from '@shared/ui';

import {
  AMBIENTE_LABELS,
  AmbientePadrao,
  Cliente,
} from '../../../models/cliente.model';
import {
  CriarEntregaForm,
  Entrega,
  formatarTamanho,
} from '../../../models/entrega.model';
import { Produto } from '../../../models/produto.model';
import { Release } from '../../../models/release.model';
import { ProximaEntrega } from '../../../models/proxima-entrega.model';
import {
  HEALTH_INSTALACAO_LABELS,
  HealthInstalacao,
  InstalacaoCliente,
  STATUS_INSTALACAO_LABELS,
  TIPO_IMPLANTACAO_LABELS,
} from '../../../models/instalacao-cliente.model';
import {
  DeltaResumo,
  EntregaModulo,
  TIPO_MODULO_LABELS,
  TIPO_MODULO_TONES,
} from '../../../models/entrega-modulo.model';
import { ClienteService } from '../../../services/cliente.service';
import { ProdutoService } from '../../../services/produto.service';
import { ReleaseService } from '../../../services/release.service';
import { ProximaEntregaService } from '../../../services/proxima-entrega.service';
import { EntregaService } from '../../../services/entrega.service';
import { EntregaModuloService } from '../../../services/entrega-modulo.service';
import { InstalacaoClienteService } from '../../../services/instalacao-cliente.service';

type Passo = 1 | 2 | 3 | 4 | 5;

const PASSOS: { id: Passo; label: string; icon: string }[] = [
  { id: 1, label: 'Cliente', icon: 'Users' },
  { id: 2, label: 'Alvos', icon: 'HardDrive' },
  { id: 3, label: 'Release', icon: 'Tag' },
  { id: 4, label: 'Módulos', icon: 'Boxes' },
  { id: 5, label: 'Revisão', icon: 'CheckCircle' },
];

@Component({
  selector: 'app-entrega-wizard',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './entrega-wizard.component.html',
  styleUrl: './entrega-wizard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregaWizardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly clienteService = inject(ClienteService);
  private readonly produtoService = inject(ProdutoService);
  private readonly releaseService = inject(ReleaseService);
  private readonly proximaService = inject(ProximaEntregaService);
  private readonly service = inject(EntregaService);
  private readonly moduloService = inject(EntregaModuloService);
  private readonly instalacaoService = inject(InstalacaoClienteService);

  protected readonly passo = signal<Passo>(1);
  protected readonly carregandoRefs = signal(false);
  protected readonly salvando = signal(false);
  protected readonly gerando = signal(false);
  protected readonly calculandoDelta = signal(false);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly produtos = signal<Produto[]>([]);
  protected readonly releases = signal<Release[]>([]);
  protected readonly proximasDoCliente = signal<ProximaEntrega[]>([]);
  protected readonly instalacoes = signal<InstalacaoCliente[]>([]);
  protected readonly carregandoInstalacoes = signal(false);
  protected readonly instalacaoIds = signal<string[]>([]);

  protected readonly entregaId = signal<string | null>(null);
  protected readonly modulos = signal<EntregaModulo[]>([]);
  protected readonly resumoDelta = signal<DeltaResumo | null>(null);
  protected readonly alterandoModuloId = signal<string | null>(null);

  protected dados: {
    clienteId: string;
    produtoId: string;
    ambiente: AmbientePadrao;
    releaseId: string;
    proximaEntregaId: string | null;
    observacoes: string;
  } = {
    clienteId: '',
    produtoId: '',
    ambiente: 'PROD',
    releaseId: '',
    proximaEntregaId: null,
    observacoes: '',
  };

  protected readonly passos = PASSOS;
  protected readonly ambientes = Object.keys(AMBIENTE_LABELS) as AmbientePadrao[];
  protected readonly ambienteLabels = AMBIENTE_LABELS;
  protected readonly tipoModuloLabels = TIPO_MODULO_LABELS;
  protected readonly tipoModuloTones = TIPO_MODULO_TONES;
  protected readonly tipoInstalacaoLabels = TIPO_IMPLANTACAO_LABELS;
  protected readonly statusInstalacaoLabels = STATUS_INSTALACAO_LABELS;
  protected readonly healthLabels = HEALTH_INSTALACAO_LABELS;
  protected readonly formatarTamanho = formatarTamanho;

  protected readonly clienteSelecionado = computed(() =>
    this.clientes().find(c => c.id === this.dados.clienteId) ?? null,
  );

  protected readonly produtoSelecionado = computed(() =>
    this.produtos().find(p => p.id === this.dados.produtoId) ?? null,
  );

  protected readonly releaseSelecionada = computed(() =>
    this.releases().find(r => r.id === this.dados.releaseId) ?? null,
  );

  protected readonly modulosSelecionados = computed(
    () => this.modulos().filter(m => m.selecionado).length,
  );

  /**
   * Versão atualmente instalada no cliente — a mais frequente entre
   * `versaoFrom` dos módulos selecionados. Se houver divergência entre
   * módulos, retorna a mais comum (silencioso, mas exibido como "range
   * aproximado" no resumo).
   */
  protected readonly versaoInstalada = computed(() => {
    const versoes = this.modulos()
      .filter(m => m.selecionado && m.versaoFrom)
      .map(m => m.versaoFrom as string);
    if (versoes.length === 0) return null;
    const contagem = new Map<string, number>();
    versoes.forEach(v => contagem.set(v, (contagem.get(v) ?? 0) + 1));
    let topo: { versao: string; n: number } | null = null;
    contagem.forEach((n, versao) => {
      if (!topo || n > topo.n) topo = { versao, n };
    });
    return topo as { versao: string; n: number } | null;
  });

  protected readonly versoesDivergentes = computed(() => {
    const versoes = new Set(
      this.modulos()
        .filter(m => m.selecionado && m.versaoFrom)
        .map(m => m.versaoFrom as string),
    );
    return versoes.size > 1;
  });

  /** Lookup do resumo do delta por moduloProdutoId, usado no passo 4. */
  protected readonly resumoPorModulo = computed(() => {
    const map = new Map<string, { artefatos: number; tamanhoBytes: number }>();
    const resumo = this.resumoDelta();
    if (!resumo) return map;
    for (const m of resumo.modulos) {
      map.set(m.moduloProdutoId, {
        artefatos: m.quantidadeArtefatos,
        tamanhoBytes: m.tamanhoBytes,
      });
    }
    return map;
  });

  protected readonly instalacoesSelecionadas = computed(() =>
    this.instalacoes().filter(i => this.instalacaoIds().includes(i.id)),
  );

  protected readonly podeAvancar = computed(() => {
    switch (this.passo()) {
      case 1:
        return !!this.dados.clienteId;
      case 2:
        return !!this.dados.produtoId && !!this.dados.ambiente && this.instalacaoIds().length > 0;
      case 3:
        return !!this.dados.releaseId;
      case 4:
        return this.modulosSelecionados() > 0;
      default:
        return false;
    }
  });

  ngOnInit(): void {
    const proximaId = this.route.snapshot.queryParamMap.get('proximaEntregaId');
    const clienteId = this.route.snapshot.queryParamMap.get('clienteId');
    this.carregarReferencias(() => {
      if (proximaId) this.prefillDaProximaEntrega(proximaId);
      else if (clienteId) {
        this.dados.clienteId = clienteId;
        this.onClienteChange();
      }
    });
  }

  private carregarReferencias(then: () => void): void {
    this.carregandoRefs.set(true);
    forkJoin({
      clientes: this.clienteService.listar(1, 100, undefined, true),
      produtos: this.produtoService.listar(1, 100),
    }).subscribe({
      next: ({ clientes, produtos }) => {
        this.clientes.set(clientes.items);
        this.produtos.set(produtos.items);
        this.carregandoRefs.set(false);
        then();
      },
      error: () => {
        this.carregandoRefs.set(false);
        this.toast.error('Não foi possível carregar clientes/produtos.');
      },
    });
  }

  private prefillDaProximaEntrega(id: string): void {
    this.proximaService.buscar(id).subscribe({
      next: pe => {
        this.dados.clienteId = pe.clienteId;
        this.dados.produtoId = pe.produtoId;
        this.dados.ambiente = pe.ambiente;
        this.dados.releaseId = pe.releaseId ?? '';
        this.dados.proximaEntregaId = pe.id;
        this.dados.observacoes = pe.observacoes ?? '';
        this.carregarProximasDoCliente();
        this.carregarReleasesDoProduto();
        this.carregarInstalacoes(true, () => {
          if (pe.releaseId && this.instalacaoIds().length > 0) {
            this.persistirRascunho();
          } else {
            this.passo.set(pe.releaseId && this.instalacaoIds().length === 0 ? 2 : 3);
          }
        });
      },
      error: () => this.toast.error('Não foi possível carregar a próxima entrega.'),
    });
  }

  protected onClienteChange(): void {
    this.dados.produtoId = '';
    this.dados.releaseId = '';
    this.dados.proximaEntregaId = null;
    this.instalacaoIds.set([]);
    this.releases.set([]);
    this.instalacoes.set([]);
    this.carregarProximasDoCliente();
  }

  private carregarProximasDoCliente(): void {
    if (!this.dados.clienteId) {
      this.proximasDoCliente.set([]);
      return;
    }
    this.proximaService
      .listar(1, 20, { clienteId: this.dados.clienteId, status: 'AGENDADA' })
      .pipe(catchError(() => of({ items: [] as ProximaEntrega[], totalItems: 0, page: 1, size: 20 })))
      .subscribe(r => this.proximasDoCliente.set(r.items));
  }

  protected onProdutoChange(): void {
    this.dados.releaseId = '';
    this.instalacaoIds.set([]);
    this.carregarReleasesDoProduto();
    this.carregarInstalacoes();
  }

  protected onAmbienteChange(): void {
    this.instalacaoIds.set([]);
    this.carregarInstalacoes();
  }

  protected toggleInstalacao(id: string): void {
    const atual = this.instalacaoIds();
    this.instalacaoIds.set(atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id]);
  }

  protected instalacaoMarcada(id: string): boolean {
    return this.instalacaoIds().includes(id);
  }

  protected tomHealth(health?: HealthInstalacao): 'success' | 'warn' | 'danger' | 'neutral' {
    if (health === 'SAUDAVEL') return 'success';
    if (health === 'DEGRADADO') return 'warn';
    if (health === 'INDISPONIVEL') return 'danger';
    return 'neutral';
  }

  private carregarInstalacoes(autoSelecionar = false, then?: () => void): void {
    if (!this.dados.clienteId || !this.dados.produtoId) {
      this.instalacoes.set([]);
      then?.();
      return;
    }
    this.carregandoInstalacoes.set(true);
    this.instalacaoService
      .listar(1, 100, undefined, this.dados.clienteId, undefined, this.dados.produtoId, undefined, undefined, this.dados.ambiente)
      .pipe(catchError(() => of({ items: [] as InstalacaoCliente[], totalItems: 0, page: 1, size: 100 })))
      .subscribe(r => {
        this.instalacoes.set(r.items);
        if (autoSelecionar) {
          this.instalacaoIds.set(r.items.map(i => i.id));
        } else {
          const ids = new Set(r.items.map(i => i.id));
          this.instalacaoIds.update(atual => atual.filter(id => ids.has(id)));
        }
        this.carregandoInstalacoes.set(false);
        then?.();
      });
  }

  private carregarReleasesDoProduto(): void {
    if (!this.dados.produtoId) {
      this.releases.set([]);
      return;
    }
    this.releaseService
      .listar({ produtoId: this.dados.produtoId, page: 1, size: 50 })
      .pipe(catchError(() => of({ items: [] as Release[], totalItems: 0, page: 1, size: 50 })))
      .subscribe(r => {
        const disponiveis = r.items.filter(
          rel => rel.status === 'APROVADA' || rel.status === 'PUBLICADA',
        );
        this.releases.set(disponiveis);
      });
  }

  protected avancar(): void {
    if (!this.podeAvancar()) return;
    if (this.passo() === 3 && !this.entregaId()) {
      this.persistirRascunho();
      return;
    }
    if (this.passo() === 4) {
      this.calcularDelta();
    }
    this.passo.update(p => Math.min(5, (p + 1) as Passo) as Passo);
  }

  protected voltar(): void {
    this.passo.update(p => Math.max(1, (p - 1) as Passo) as Passo);
  }

  protected irParaPasso(p: Passo): void {
    if (p > this.passo()) return;
    this.passo.set(p);
  }

  private persistirRascunho(): void {
    this.salvando.set(true);
    const form: CriarEntregaForm = {
      clienteId: this.dados.clienteId,
      produtoId: this.dados.produtoId,
      releaseId: this.dados.releaseId,
      ambiente: this.dados.ambiente,
      proximaEntregaId: this.dados.proximaEntregaId ?? undefined,
      observacoes: this.dados.observacoes || undefined,
      instalacaoIds: this.instalacaoIds(),
    };
    this.service
      .criar(form)
      .pipe(
        switchMap((e: Entrega) => {
          this.entregaId.set(e.id);
          return this.moduloService.inicializarModulos(e.id);
        }),
      )
      .subscribe({
        next: mods => {
          this.modulos.set(mods);
          this.salvando.set(false);
          this.passo.set(4);
        },
        error: () => {
          this.salvando.set(false);
          this.toast.error('Não foi possível criar o rascunho.');
        },
      });
  }

  protected toggleSelecao(m: EntregaModulo): void {
    const id = this.entregaId();
    if (!id) return;
    this.alterandoModuloId.set(m.moduloProdutoId);
    this.moduloService.alterarSelecao(id, m.moduloProdutoId, !m.selecionado).subscribe({
      next: upd => {
        this.modulos.update(list => list.map(x => (x.id === upd.id ? upd : x)));
        // Preview vira stale após mudar seleção — força recalcular.
        this.resumoDelta.set(null);
        this.alterandoModuloId.set(null);
      },
      error: () => {
        this.alterandoModuloId.set(null);
        this.toast.error('Não foi possível alterar a seleção.');
      },
    });
  }

  /**
   * Disparado pelo botão "Calcular preview" no passo 4 e automaticamente
   * ao avançar para o passo 5. Idempotente — pode ser chamado várias vezes.
   */
  protected calcularDelta(): void {
    const id = this.entregaId();
    if (!id) return;
    this.calculandoDelta.set(true);
    this.moduloService.calcularDelta(id).subscribe({
      next: r => {
        this.resumoDelta.set(r);
        this.calculandoDelta.set(false);
      },
      error: () => {
        this.calculandoDelta.set(false);
        this.toast.error('Não foi possível calcular o delta.');
      },
    });
  }

  protected salvarRascunho(): void {
    const id = this.entregaId();
    if (!id) return;
    this.toast.success('Rascunho salvo. Você pode retomar pelo histórico.');
    this.router.navigate(['/release-orchestrator/entregas', id]);
  }

  protected gerarPacote(): void {
    const id = this.entregaId();
    if (!id) return;
    this.gerando.set(true);
    this.service.iniciarGeracao(id).subscribe({
      next: () => {
        this.gerando.set(false);
        this.toast.success('Geração iniciada.');
        this.router.navigate(['/release-orchestrator/entregas', id]);
      },
      error: () => {
        this.gerando.set(false);
        this.toast.error('Não foi possível iniciar a geração.');
      },
    });
  }
}
