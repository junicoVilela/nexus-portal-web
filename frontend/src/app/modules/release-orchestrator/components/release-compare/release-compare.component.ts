import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BadgeComponent, ButtonComponent } from '@shared/ui';
import { forkJoin } from 'rxjs';
import { Release, RELEASE_STATUS_LABELS, RELEASE_TIPO_LABELS } from '../../models/release.model';
import { CATEGORIA_LABELS, CATEGORIAS_ORDENADAS, ReleaseItem } from '../../models/release-item.model';
import { ReleaseService } from '../../services/release.service';
import { ReleaseItemService } from '../../services/release-item.service';

interface CategoriaGrupo {
  categoria: string;
  label: string;
  esquerda: ReleaseItem[];
  direita: ReleaseItem[];
}

@Component({
  selector: 'app-release-compare',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, BadgeComponent, ButtonComponent],
  templateUrl: './release-compare.component.html',
  styleUrl: './release-compare.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseCompareComponent implements OnInit {
  readonly leftId = input.required<string>();
  readonly rightId = input.required<string>();

  readonly fechar = output<void>();

  private readonly releaseService = inject(ReleaseService);
  private readonly itemService = inject(ReleaseItemService);

  protected readonly loading = signal(true);
  protected readonly esquerda = signal<Release | null>(null);
  protected readonly direita = signal<Release | null>(null);
  protected readonly itensEsquerda = signal<ReleaseItem[]>([]);
  protected readonly itensDireita = signal<ReleaseItem[]>([]);

  protected readonly statusLabels = RELEASE_STATUS_LABELS;
  protected readonly tipoLabels = RELEASE_TIPO_LABELS;
  protected readonly categoriaLabels = CATEGORIA_LABELS;

  protected readonly grupos = computed<CategoriaGrupo[]>(() => {
    const e = this.itensEsquerda();
    const d = this.itensDireita();
    return CATEGORIAS_ORDENADAS.map(cat => ({
      categoria: cat,
      label: this.categoriaLabels[cat],
      esquerda: e.filter(i => i.categoria === cat),
      direita: d.filter(i => i.categoria === cat),
    })).filter(g => g.esquerda.length || g.direita.length);
  });

  ngOnInit(): void {
    forkJoin({
      relE: this.releaseService.buscarPorId(this.leftId()),
      relD: this.releaseService.buscarPorId(this.rightId()),
      itensE: this.itemService.listar(this.leftId()),
      itensD: this.itemService.listar(this.rightId()),
    }).subscribe({
      next: ({ relE, relD, itensE, itensD }) => {
        this.esquerda.set(relE);
        this.direita.set(relD);
        this.itensEsquerda.set(itensE);
        this.itensDireita.set(itensD);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
