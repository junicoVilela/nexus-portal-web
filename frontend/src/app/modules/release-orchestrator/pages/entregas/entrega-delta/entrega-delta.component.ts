import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  PageHeaderComponent,
  SkeletonComponent,
  ToastService,
} from '@shared/ui';
import { classificarErro } from '@shared/utils/error-classifier';

import {
  Entrega,
  formatarTamanho,
  STATUS_ENTREGA_LABELS,
} from '../../../models/entrega.model';
import {
  CalcularDeltaForm,
  DeltaResumo,
  EntregaModulo,
  EntregaModuloArtefato,
  TIPO_MODULO_LABELS,
  TIPO_MODULO_TONES,
} from '../../../models/entrega-modulo.model';
import { EntregaService } from '../../../services/entrega.service';
import { EntregaModuloService } from '../../../services/entrega-modulo.service';

interface LinhaModulo {
  em: EntregaModulo;
  fromOriginal: string | null;
  fromEdit: string;
  justificativa: string;
  artefatos: EntregaModuloArtefato[];
}

@Component({
  selector: 'app-entrega-delta',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    KpiCardComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './entrega-delta.component.html',
  styleUrl: './entrega-delta.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregaDeltaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EntregaService);
  private readonly moduloService = inject(EntregaModuloService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly recalculando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly erroVariant = signal<ErrorVariant>('generic');
  protected readonly entrega = signal<Entrega | null>(null);
  protected readonly linhas = signal<LinhaModulo[]>([]);
  protected readonly resumo = signal<DeltaResumo | null>(null);

  protected readonly tipoLabels = TIPO_MODULO_LABELS;
  protected readonly tipoTones = TIPO_MODULO_TONES;
  protected readonly statusLabels = STATUS_ENTREGA_LABELS;
  protected readonly formatarTamanho = formatarTamanho;

  protected readonly podeEditar = computed(() => {
    const e = this.entrega();
    return e?.status === 'RASCUNHO' || e?.status === 'FALHA';
  });

  protected readonly modulosSelecionados = computed(
    () => this.linhas().filter(l => l.em.selecionado).length,
  );

  protected readonly temAlteracoes = computed(() =>
    this.linhas().some(l => l.fromEdit !== (l.fromOriginal ?? '')),
  );

  protected entregaId!: string;

  ngOnInit(): void {
    this.entregaId = this.route.snapshot.paramMap.get('id') ?? '';
    this.carregar();
  }

  protected carregar(): void {
    this.loading.set(true);
    this.erro.set(null);
    forkJoin({
      entrega: this.service.buscar(this.entregaId),
      modulos: this.moduloService.listarModulos(this.entregaId)
        .pipe(catchError(() => of([] as EntregaModulo[]))),
      artefatos: this.moduloService.listarDelta(this.entregaId)
        .pipe(catchError(() => of([] as EntregaModuloArtefato[]))),
      resumo: this.moduloService.resumoDelta(this.entregaId)
        .pipe(catchError(() => of(null as DeltaResumo | null))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ entrega, modulos, artefatos, resumo }) => {
          this.entrega.set(entrega);
          this.resumo.set(resumo);
          const porModulo = new Map<string, EntregaModuloArtefato[]>();
          artefatos.forEach(a => {
            const lista = porModulo.get(a.moduloProdutoId) ?? [];
            lista.push(a);
            porModulo.set(a.moduloProdutoId, lista);
          });
          this.linhas.set(
            modulos
              .filter(m => m.selecionado)
              .map(em => ({
                em,
                fromOriginal: em.versaoFrom ?? null,
                fromEdit: em.versaoFrom ?? '',
                justificativa: '',
                artefatos: porModulo.get(em.moduloProdutoId) ?? [],
              })),
          );
        },
        error: err => {
          this.erroVariant.set(classificarErro(err));
          this.erro.set('Não foi possível carregar o delta.');
        },
      });
  }

  protected restaurarOriginal(linha: LinhaModulo): void {
    this.linhas.update(list =>
      list.map(l => (l === linha ? { ...l, fromEdit: l.fromOriginal ?? '' } : l)),
    );
  }

  protected onFromEdit(linha: LinhaModulo, valor: string): void {
    this.linhas.update(list =>
      list.map(l => (l === linha ? { ...l, fromEdit: valor } : l)),
    );
  }

  protected onJustificativaEdit(linha: LinhaModulo, valor: string): void {
    this.linhas.update(list =>
      list.map(l => (l === linha ? { ...l, justificativa: valor } : l)),
    );
  }

  protected recalcular(): void {
    if (!this.podeEditar()) return;
    const linhas = this.linhas();
    const alteradas = linhas.filter(l => l.fromEdit !== (l.fromOriginal ?? ''));
    const semJustificativa = alteradas.find(l => !l.justificativa.trim());
    if (semJustificativa) {
      this.toast.warn(
        `Informe a justificativa para o módulo ${semJustificativa.em.moduloCodigo}.`,
      );
      return;
    }
    const form: CalcularDeltaForm = {
      modulos: alteradas.map(l => ({
        moduloProdutoId: l.em.moduloProdutoId,
        fromTag: l.fromEdit.trim() || undefined,
        justificativa: l.justificativa.trim(),
      })),
    };
    this.recalculando.set(true);
    this.moduloService.calcularDelta(this.entregaId, form).subscribe({
      next: () => {
        this.recalculando.set(false);
        this.toast.success('Delta recalculado.');
        this.carregar();
      },
      error: () => {
        this.recalculando.set(false);
        this.toast.error('Não foi possível recalcular o delta.');
      },
    });
  }

  protected confirmar(): void {
    this.router.navigate(['/release-orchestrator/entregas', this.entregaId]);
  }
}
