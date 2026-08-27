import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import {
  BUILD_STATUS_LABELS,
  BUILD_STATUS_TONES,
  Release,
  RELEASE_STATUS_LABELS,
  RELEASE_TIPO_LABELS,
  ReleaseStatus,
  podeEditar,
} from '../../../models/release.model';
import {
  ReleaseItem,
  ReleaseItemForm,
  CATEGORIA_LABELS,
  CATEGORIA_ICONES,
  CATEGORIA_CORES,
  VISIBILIDADE_ITEM_LABELS,
  CATEGORIAS_ORDENADAS,
  CategoriaItem,
} from '../../../models/release-item.model';
import { ReleaseHistorico, ACAO_HISTORICO_ICONES } from '../../../models/release-historico.model';
import { ReleaseService } from '../../../services/release.service';
import { ReleaseItemService } from '../../../services/release-item.service';
import { ReleasePdfService } from '../../../services/release-pdf.service';

import { LucideAngularModule } from 'lucide-angular';
import {
  BadgeComponent,
  CardComponent,
  ButtonComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ErrorVariant,
  SkeletonComponent,
  TabItem,
  TabsComponent,
  ToastService,
} from '@shared/ui';
import { AuthService } from '@core/auth/services/auth.service';
import { classificarErro } from '@shared/utils/error-classifier';
import { ReleaseStatusBadgeComponent } from '../../../components/release-status-badge';
import { HistoricoTimelineComponent } from '../../../components/historico-timeline';
import { ArtefatosTabComponent } from './artefatos-tab/artefatos-tab.component';
import { ManifestoImplantacao } from '../../../models/deploy-instalacao.model';
import { TIPO_IMPLANTACAO_LABELS } from '../../../models/instalacao-cliente.model';

@Component({
  selector: 'app-release-detalhe',
  standalone: true,
  imports: [
    DatePipe,
    SlicePipe,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    DragDropModule,
    BadgeComponent,
    CardComponent,
    ButtonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
    TabsComponent,
    ReleaseStatusBadgeComponent,
    HistoricoTimelineComponent,
    ArtefatosTabComponent,
  ],
  templateUrl: './release-detalhe.component.html',
  styleUrl: './release-detalhe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseDetalheComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly salvandoItem = signal(false);
  protected readonly release = signal<Release | null>(null);
  protected readonly itens = signal<ReleaseItem[]>([]);
  protected readonly historico = signal<ReleaseHistorico[]>([]);

  protected readonly showItemForm = signal(false);
  protected readonly editItemId = signal<string | null>(null);
  protected itemForm!: FormGroup;

  protected readonly activeTab = signal<'itens' | 'artefatos' | 'manifesto' | 'historico'>('itens');
  protected readonly tabsConfig = computed<TabItem<'itens' | 'artefatos' | 'manifesto' | 'historico'>[]>(() => [
    { id: 'itens', label: 'Itens', icon: 'List', count: this.itens().length },
    { id: 'artefatos', label: 'Artefatos', icon: 'Boxes' },
    { id: 'manifesto', label: 'Manifesto', icon: 'Rocket' },
    { id: 'historico', label: 'Histórico', icon: 'Clock' },
  ]);

  protected readonly statusLabels = RELEASE_STATUS_LABELS;
  protected readonly tipoLabels = RELEASE_TIPO_LABELS;
  protected readonly buildStatusLabels = BUILD_STATUS_LABELS;
  protected readonly buildStatusTones = BUILD_STATUS_TONES;
  protected readonly categoriaLabels = CATEGORIA_LABELS;
  protected readonly categoriaIcones = CATEGORIA_ICONES;
  protected readonly categoriaCores = CATEGORIA_CORES;
  protected readonly visibilidadeItemLabels = VISIBILIDADE_ITEM_LABELS;
  protected readonly categoriasOrdenadas = CATEGORIAS_ORDENADAS;
  protected readonly acaoIcones = ACAO_HISTORICO_ICONES;

  protected readonly todasCategorias = Object.keys(CATEGORIA_LABELS) as CategoriaItem[];
  protected readonly todasVisibilidades = Object.keys(
    VISIBILIDADE_ITEM_LABELS,
  ) as (keyof typeof VISIBILIDADE_ITEM_LABELS)[];

  protected readonly manifestos = signal<ManifestoImplantacao[]>([]);
  protected readonly salvandoManifestoTipo = signal<string | null>(null);
  protected readonly tipoImplantacaoLabels = TIPO_IMPLANTACAO_LABELS;
  protected readonly podeEditarManifesto = computed(() => this.auth.tem()('RELEASE:EDITAR'));
  protected readonly podeEditarRelease = computed(() => {
    const rel = this.release();
    return rel ? podeEditar(rel.status) : false;
  });

  protected readonly itensPorCategoria = computed(() => {
    const lista = this.itens();
    return this.categoriasOrdenadas
      .map(cat => ({
        categoria: cat,
        label: this.categoriaLabels[cat],
        icon: this.categoriaIcones[cat],
        cor: this.categoriaCores[cat],
        itens: lista.filter(i => i.categoria === cat),
      }))
      .filter(g => g.itens.length > 0);
  });

  protected releaseId!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly releaseService: ReleaseService,
    private readonly itemService: ReleaseItemService,
    private readonly pdfService: ReleasePdfService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.releaseId = this.route.snapshot.paramMap.get('id')!;
    this.buildItemForm();
    const preloaded = this.route.snapshot.data['release'] as Release | null | undefined;
    if (preloaded) {
      this.release.set(preloaded);
      this.loading.set(false);
      this.carregarItens();
      this.carregarHistorico();
      this.carregarManifestos();
    } else {
      this.carregar();
    }
  }

  private buildItemForm(): void {
    this.itemForm = this.fb.group({
      categoria: ['NOVIDADE', Validators.required],
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descricao: [''],
      visibilidade: ['TODOS', Validators.required],
      ticket: [''],
      commit: [''],
      pullRequest: [''],
    });
  }

  protected recarregar(): void {
    this.carregar();
  }

  private carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    this.releaseService.buscarPorId(this.releaseId).subscribe({
      next: rel => {
        this.release.set(rel);
        this.carregarItens();
        this.carregarHistorico();
        this.carregarManifestos();
      },
      error: err => {
        this.erroVariant.set(classificarErro(err));
        this.erro.set('Release não encontrada ou erro ao carregar.');
        this.release.set(null);
        this.itens.set([]);
        this.historico.set([]);
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

  private carregarHistorico(): void {
    this.releaseService.listarHistorico(this.releaseId).subscribe({
      next: h => this.historico.set(h),
      error: () => this.historico.set([]),
    });
  }

  private carregarManifestos(): void {
    this.releaseService.listarManifestos(this.releaseId).subscribe({
      next: m => this.manifestos.set(m.map(item => ({ ...item }))),
      error: () => this.manifestos.set([]),
    });
  }

  protected salvarManifesto(m: ManifestoImplantacao): void {
    this.salvandoManifestoTipo.set(m.tipoImplantacao);
    this.releaseService
      .salvarManifesto(this.releaseId, {
        tipoImplantacao: m.tipoImplantacao,
        imagemRef: m.imagemRef || undefined,
        arquivoImagemRef: m.arquivoImagemRef || undefined,
        diretorioInstalacao: m.diretorioInstalacao || undefined,
        observacoes: m.observacoes || undefined,
      })
      .subscribe({
        next: saved => {
          this.manifestos.update(list =>
            list.map(item => (item.tipoImplantacao === saved.tipoImplantacao ? { ...saved } : item)),
          );
          this.salvandoManifestoTipo.set(null);
          this.toast.success('Manifesto salvo para ' + this.tipoImplantacaoLabels[m.tipoImplantacao] + '.');
        },
        error: () => {
          this.salvandoManifestoTipo.set(null);
          this.toast.error('Não foi possível salvar o manifesto.');
        },
      });
  }

  protected abrirNovoItem(): void {
    this.editItemId.set(null);
    this.itemForm.reset({ categoria: 'NOVIDADE', visibilidade: 'TODOS' });
    this.showItemForm.set(true);
  }

  protected editarItem(item: ReleaseItem): void {
    this.editItemId.set(item.id);
    this.itemForm.patchValue(item);
    this.showItemForm.set(true);
  }

  protected fecharItemForm(): void {
    this.showItemForm.set(false);
  }

  protected salvarItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    this.salvandoItem.set(true);
    const data: ReleaseItemForm = this.itemForm.value;
    const id = this.editItemId();
    const op = id
      ? this.itemService.atualizar(this.releaseId, id, data)
      : this.itemService.criar(this.releaseId, data);
    op.subscribe({
      next: item => {
        if (id) {
          this.itens.update(list => list.map(i => (i.id === item.id ? item : i)));
        } else {
          this.itens.update(list => [...list, { ...item, ordem: list.length + 1 }]);
        }
        this.showItemForm.set(false);
        this.salvandoItem.set(false);
      },
      error: () => this.salvandoItem.set(false),
    });
  }

  protected removerItem(item: ReleaseItem): void {
    this.itemService.remover(this.releaseId, item.id).subscribe({
      next: () => this.itens.update(list => list.filter(i => i.id !== item.id)),
      error: () => undefined /* feedback via errorInterceptor */,
    });
  }

  protected duplicarItem(item: ReleaseItem): void {
    this.itemService.duplicar(this.releaseId, item.id).subscribe({
      next: dup => this.itens.update(list => [...list, dup]),
      error: () => undefined /* feedback via errorInterceptor */,
    });
  }

  protected onItemDrop(event: CdkDragDrop<ReleaseItem[]>, categoria: CategoriaItem): void {
    if (event.previousIndex === event.currentIndex) return;
    const grupo = this.itens()
      .filter(i => i.categoria === categoria)
      .sort((a, b) => a.ordem - b.ordem);
    moveItemInArray(grupo, event.previousIndex, event.currentIndex);
    const ordensAtualizadas = grupo.map((item, idx) => ({ id: item.id, ordem: idx + 1 }));
    const ordemMap = new Map(ordensAtualizadas.map(o => [o.id, o.ordem]));
    this.itens.update(list => list.map(i => (ordemMap.has(i.id) ? { ...i, ordem: ordemMap.get(i.id)! } : i)));
    this.itemService.reordenar(this.releaseId, ordensAtualizadas).subscribe({
      error: () => this.carregarItens(),
    });
  }

  protected alterarStatus(status: ReleaseStatus): void {
    this.releaseService.alterarStatus(this.releaseId, status).subscribe({
      next: rel => this.release.set(rel),
      error: () => undefined /* feedback via errorInterceptor */,
    });
  }

  protected gerarPdf(tipo: 'CLIENTE' | 'SUPORTE' | 'INTERNO' = 'INTERNO'): void {
    const rel = this.release();
    if (!rel) return;
    const nome = `${rel.produtoSigla}-${rel.versao}-${tipo.toLowerCase()}.pdf`;
    this.pdfService.download(this.releaseId, tipo, nome);
  }

  protected irParaArtefatos(): void {
    this.activeTab.set('artefatos');
  }

  protected onBuildDisparado(): void {
    this.releaseService.buscarPorId(this.releaseId).subscribe({
      next: rel => this.release.set(rel),
      error: () => undefined,
    });
    this.carregarHistorico();
  }

  protected irParaRevisao(): void {
    this.router.navigate(['/release-orchestrator/releases', this.releaseId, 'revisao']);
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

  protected getStatusLabel(s: string): string {
    return this.statusLabels[s as ReleaseStatus] ?? s;
  }

  protected itemFieldError(field: string): boolean {
    const c = this.itemForm.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
