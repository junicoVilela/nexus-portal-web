import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { Dominio } from '@modules/identity-access/models/dominio.model';
import { Funcionalidade } from '@modules/identity-access/models/funcionalidade.model';
import { Permissao } from '@modules/identity-access/models/permissao.model';
import { DominioService } from '@modules/identity-access/services/dominio.service';
import { FuncionalidadeService } from '@modules/identity-access/services/funcionalidade.service';
import { PermissaoService } from '@modules/identity-access/services/permissao.service';
import {
  BadgeComponent,
  CardComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/ui';

@Component({
  selector: 'app-matriz-seguranca',
  standalone: true,
  imports: [PageHeaderComponent, CardComponent, BadgeComponent],
  templateUrl: './matriz.component.html',
  styleUrl: './matriz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-form-page' },
})
export class MatrizComponent implements OnInit {
  private readonly dominioService = inject(DominioService);
  private readonly funcionalidadeService = inject(FuncionalidadeService);
  private readonly permissaoService = inject(PermissaoService);
  private readonly toast = inject(ToastService);

  protected readonly dominios = signal<Dominio[]>([]);
  protected readonly funcionalidades = signal<Funcionalidade[]>([]);
  protected readonly permissoes = signal<Permissao[]>([]);

  protected readonly dominioSelId = signal<string | null>(null);
  protected readonly funcionalidadeSelId = signal<string | null>(null);

  protected readonly loading = signal(false);

  protected readonly funcionalidadesDoDominio = computed<Funcionalidade[]>(() => {
    const id = this.dominioSelId();
    if (!id) return [];
    return this.funcionalidades().filter(f => f.dominioId === id);
  });

  protected readonly permissoesDaFuncionalidade = computed<Permissao[]>(() => {
    const id = this.funcionalidadeSelId();
    if (!id) return [];
    return this.permissoes().filter(p => p.funcionalidadeId === id);
  });

  protected readonly dominioSel = computed<Dominio | undefined>(() =>
    this.dominios().find(d => d.id === this.dominioSelId()),
  );

  protected readonly funcionalidadeSel = computed<Funcionalidade | undefined>(() =>
    this.funcionalidades().find(f => f.id === this.funcionalidadeSelId()),
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    forkJoin({
      dominios: this.dominioService.listarTodos(),
      funcionalidades: this.funcionalidadeService.listar({ size: 500 }),
      permissoes: this.permissaoService.listarTodos(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ dominios, funcionalidades, permissoes }) => {
          this.dominios.set(dominios);
          this.funcionalidades.set(funcionalidades.items);
          this.permissoes.set(permissoes);
          if (!this.dominioSelId() && dominios.length > 0) {
            this.selecionarDominio(dominios[0]);
          }
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar matriz de segurança.'),
      });
  }

  selecionarDominio(d: Dominio): void {
    this.dominioSelId.set(d.id);
    this.funcionalidadeSelId.set(null);
    const primeira = this.funcionalidades().find(f => f.dominioId === d.id);
    if (primeira) this.funcionalidadeSelId.set(primeira.id);
  }

  selecionarFuncionalidade(f: Funcionalidade): void {
    this.funcionalidadeSelId.set(f.id);
  }
}
