import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { Dominio } from '@modules/seguranca/models/dominio.model';
import { Funcionalidade } from '@modules/seguranca/models/funcionalidade.model';
import { GrupoAcesso } from '@modules/seguranca/models/grupo-acesso.model';
import { Permissao } from '@modules/seguranca/models/permissao.model';
import { Usuario } from '@modules/seguranca/models/usuario.model';
import { DominioService } from '@modules/seguranca/services/dominio.service';
import { FuncionalidadeService } from '@modules/seguranca/services/funcionalidade.service';
import { GrupoService } from '@modules/seguranca/services/grupo.service';
import { PermissaoService } from '@modules/seguranca/services/permissao.service';
import { UsuarioService } from '@modules/seguranca/services/usuario.service';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/ui';

interface FuncionalidadeComPermissoes {
  funcionalidade: Funcionalidade;
  permissoes: Permissao[];
}

interface DominioArvore {
  dominio: Dominio;
  funcionalidades: FuncionalidadeComPermissoes[];
  totalPermissoes: number;
}

@Component({
  selector: 'app-grupo-permissoes',
  standalone: true,
  imports: [LucideAngularModule, PageHeaderComponent, ButtonComponent, CardComponent, BadgeComponent],
  templateUrl: './grupo-permissoes.component.html',
  styleUrl: './grupo-permissoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-form-page' },
})
export class GrupoPermissoesComponent implements OnInit {
  private readonly grupoService = inject(GrupoService);
  private readonly dominioService = inject(DominioService);
  private readonly funcionalidadeService = inject(FuncionalidadeService);
  private readonly permissaoService = inject(PermissaoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly grupo = signal<GrupoAcesso | undefined>(undefined);
  protected readonly dominios = signal<Dominio[]>([]);
  protected readonly funcionalidades = signal<Funcionalidade[]>([]);
  protected readonly permissoes = signal<Permissao[]>([]);
  protected readonly usuariosDoGrupo = signal<Usuario[]>([]);

  protected readonly selecionadas = signal<Set<string>>(new Set());
  protected readonly loading = signal(false);
  protected readonly salvando = signal(false);

  protected readonly grupoId = signal('');

  protected readonly arvore = computed<DominioArvore[]>(() => {
    const doms = this.dominios();
    const funcs = this.funcionalidades();
    const perms = this.permissoes();
    return doms
      .map(d => {
        const funcsDoDom = funcs.filter(f => f.dominioId === d.id);
        const arvoreFunc: FuncionalidadeComPermissoes[] = funcsDoDom
          .map(f => ({
            funcionalidade: f,
            permissoes: perms.filter(p => p.funcionalidadeId === f.id),
          }))
          .filter(g => g.permissoes.length > 0);
        return {
          dominio: d,
          funcionalidades: arvoreFunc,
          totalPermissoes: arvoreFunc.reduce((s, g) => s + g.permissoes.length, 0),
        };
      })
      .filter(g => g.totalPermissoes > 0);
  });

  protected readonly totalSelecionadas = computed(() => this.selecionadas().size);
  protected readonly totalPermissoes = computed(() => this.permissoes().length);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.grupoId.set(id);
    this.loading.set(true);
    forkJoin({
      grupo: this.grupoService.buscarPorId(id),
      dominios: this.dominioService.listarTodos(),
      funcionalidades: this.funcionalidadeService.listar({ size: 500 }),
      permissoes: this.permissaoService.listarTodos(),
      membros: this.grupoService.listarMembros(id),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ grupo, dominios, funcionalidades, permissoes, membros }) => {
          this.grupo.set(grupo);
          this.dominios.set(dominios.filter(d => d.ativo));
          this.funcionalidades.set(funcionalidades.items.filter(f => f.ativo));
          this.permissoes.set(permissoes.filter(p => p.ativo));
          this.selecionadas.set(new Set(grupo.permissaoIds ?? []));
          this.carregarUsuarios(membros);
        },
        error: e => this.toast.error(e?.message ?? 'Erro ao carregar dados.'),
      });
  }

  private carregarUsuarios(ids: string[]): void {
    if (ids.length === 0) {
      this.usuariosDoGrupo.set([]);
      return;
    }
    this.usuarioService.listar({ size: 500 }).subscribe({
      next: r => this.usuariosDoGrupo.set(r.items.filter(u => ids.includes(u.id))),
      error: e => this.toast.error(e?.message ?? 'Erro ao carregar usuários do grupo.'),
    });
  }

  toggle(id: string): void {
    this.selecionadas.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  marcarTodosDaFuncionalidade(g: FuncionalidadeComPermissoes): void {
    const ids = g.permissoes.map(p => p.id);
    const todasMarcadas = ids.every(id => this.selecionadas().has(id));
    this.selecionadas.update(set => {
      const next = new Set(set);
      if (todasMarcadas) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }

  marcarTodosDoDominio(d: DominioArvore): void {
    const ids = d.funcionalidades.flatMap(f => f.permissoes.map(p => p.id));
    const todasMarcadas = ids.every(id => this.selecionadas().has(id));
    this.selecionadas.update(set => {
      const next = new Set(set);
      if (todasMarcadas) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }

  marcarTudo(): void {
    this.selecionadas.set(new Set(this.permissoes().map(p => p.id)));
  }

  limparTudo(): void {
    this.selecionadas.set(new Set());
  }

  estaSelecionada(id: string): boolean {
    return this.selecionadas().has(id);
  }

  totalSelecionadasFuncionalidade(g: FuncionalidadeComPermissoes): number {
    const set = this.selecionadas();
    return g.permissoes.filter(p => set.has(p.id)).length;
  }

  totalSelecionadasDominio(d: DominioArvore): number {
    const set = this.selecionadas();
    return d.funcionalidades.reduce((sum, g) => sum + g.permissoes.filter(p => set.has(p.id)).length, 0);
  }

  salvar(): void {
    if (this.salvando()) return;
    this.salvando.set(true);
    const ids = [...this.selecionadas()];
    this.grupoService
      .vincularPermissoes(this.grupoId(), ids)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => this.toast.success('Permissões salvas.'),
        error: e => this.toast.error(e?.message ?? 'Erro ao salvar permissões.'),
      });
  }

  voltar(): void {
    this.router.navigate(['/seguranca/grupos']);
  }

  protected readonly isAdminGroup = computed(() => this.grupo()?.codigo === 'ADMIN');
}
