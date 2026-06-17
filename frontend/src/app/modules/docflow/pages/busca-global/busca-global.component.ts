import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TIMINGS } from '@core/config/timings';
import { ClienteService } from '@modules/docflow/services/cliente.service';
import { ModuloService } from '@modules/docflow/services/modulo.service';
import { PaginaService } from '@modules/docflow/services/pagina.service';
import { ProjetoService } from '@modules/docflow/services/projeto.service';
import { PublicacaoService } from '@modules/docflow/services/publicacao.service';
import { docFlowRouterCommands } from '@core/config/doc-flow-router.util';
import { Cliente } from '@modules/docflow/models/cliente.model';
import { Modulo } from '@modules/docflow/models/modulo.model';
import { Pagina } from '@modules/docflow/models/pagina.model';
import { Projeto } from '@modules/docflow/models/projeto.model';
import { Publicacao } from '@modules/docflow/models/publicacao.model';
import {
  PageHeaderComponent,
  CardComponent,
  ButtonComponent,
  BadgeComponent,
  ToastService,
} from '@shared/ui';
import { BuscaResultListComponent } from '@modules/docflow/components/busca-result-list';

@Component({
  selector: 'app-busca-global',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    BuscaResultListComponent,
  ],
  templateUrl: './busca-global.component.html',
  styleUrl: './busca-global.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscaGlobalComponent implements OnInit, OnDestroy {
  private readonly toast = inject(ToastService);

  protected termo = '';
  protected readonly carregando = signal(false);
  protected readonly tipoAtivo = signal<
    'todos' | 'clientes' | 'projetos' | 'modulos' | 'paginas' | 'publicacoes'
  >('todos');
  private readonly destroy$ = new Subject<void>();

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly projetos = signal<Projeto[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly paginas = signal<Pagina[]>([]);
  protected readonly publicacoes = signal<Publicacao[]>([]);
  protected publicacoesSort = 'createdAt';
  protected publicacoesDir: 'ASC' | 'DESC' = 'DESC';

  readonly form = this.fb.nonNullable.group({
    q: [''],
  });

  readonly clientePrimary = (c: Cliente): string => c.nome;
  readonly clienteSecondary = (c: Cliente): string => c.slug;
  readonly projetoPrimary = (p: Projeto): string => p.nome;
  readonly projetoSecondary = (p: Projeto): string => p.slug;
  readonly moduloPrimary = (m: Modulo): string => m.nome;
  readonly moduloSecondary = (m: Modulo): string => `${m.projetoNome} · ${m.slug}`;
  readonly paginaPrimary = (p: Pagina): string => p.titulo;
  readonly paginaSecondary = (p: Pagina): string => `${p.projetoNome} · ${p.moduloNome} · ${p.codigoTela}`;

  constructor(
    private readonly fb: FormBuilder,
    private readonly clienteService: ClienteService,
    private readonly projetoService: ProjetoService,
    private readonly moduloService: ModuloService,
    private readonly paginaService: PaginaService,
    private readonly publicacaoService: PublicacaoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.termo = params.get('q') ?? '';
      this.form.patchValue({ q: this.termo }, { emitEvent: false });
      if (this.termo.trim()) {
        this.buscar();
      }
    });
    this.form.controls.q.valueChanges
      .pipe(debounceTime(TIMINGS.searchDebounceMs), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.buscar());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buscar(): void {
    this.termo = this.form.controls.q.value.trim();
    this.atualizarUrl();
    if (!this.termo) {
      this.limparResultados();
      return;
    }
    this.carregando.set(true);
    forkJoin({
      clientes: this.clienteService.clientes(),
      projetos: this.projetoService.projetos(),
      modulos: this.moduloService.modulos(),
      paginas: this.paginaService.paginas({ busca: this.termo }),
      publicacoes: this.publicacaoService.publicacoes(),
    }).subscribe({
      next: ({ clientes, projetos, modulos, paginas, publicacoes }) => {
        const termo = this.normalizar(this.termo);
        this.clientes.set(
          clientes.filter(item => this.match(item.nome, termo) || this.match(item.slug, termo)),
        );
        this.projetos.set(
          projetos.filter(item => this.match(item.nome, termo) || this.match(item.slug, termo)),
        );
        this.modulos.set(
          modulos.filter(
            item =>
              this.match(item.nome, termo) ||
              this.match(item.slug, termo) ||
              this.match(item.projetoNome, termo),
          ),
        );
        this.paginas.set(paginas);
        this.publicacoes.set(
          this.sortPublicacoes(
            publicacoes.filter(
              item =>
                this.match(item.clienteNome, termo) ||
                this.match(item.versao, termo) ||
                this.match(item.arquivoZipNome, termo),
            ),
          ),
        );
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.toast.error('Erro ao executar a busca.');
      },
    });
  }

  abrirPagina(pagina: Pagina): void {
    this.router.navigate(docFlowRouterCommands(['paginas', pagina.id, 'editar']));
  }

  abrirCliente(cliente: Cliente): void {
    this.router.navigate(docFlowRouterCommands(['clientes']), { queryParams: { clienteId: cliente.id } });
  }

  abrirProjeto(projeto: Projeto): void {
    this.router.navigate(docFlowRouterCommands(['projetos']), { queryParams: { nome: projeto.nome } });
  }

  abrirModulo(modulo: Modulo): void {
    this.router.navigate(docFlowRouterCommands(['modulos']), {
      queryParams: { projetoId: modulo.projetoId, nome: modulo.nome },
    });
  }

  abrirPublicacao(_publicacao: Publicacao): void {
    this.router.navigate(docFlowRouterCommands(['publicacoes']), { queryParams: { page: 1 } });
  }

  ordenarPublicacoes(campo: string): void {
    if (this.publicacoesSort === campo) {
      this.publicacoesDir = this.publicacoesDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.publicacoesSort = campo;
      this.publicacoesDir = 'ASC';
    }
    this.publicacoes.update(list => this.sortPublicacoes([...list]));
  }

  indicacaoOrdenacaoPublicacoes(campo: string): string {
    if (this.publicacoesSort !== campo) return '↕';
    return this.publicacoesDir === 'ASC' ? '↑' : '↓';
  }

  private limparResultados(): void {
    this.clientes.set([]);
    this.projetos.set([]);
    this.modulos.set([]);
    this.paginas.set([]);
    this.publicacoes.set([]);
  }

  private atualizarUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: this.termo ? { q: this.termo } : {},
    });
  }

  private normalizar(value: string): string {
    return value.trim().toLowerCase();
  }

  private match(source: string | undefined, term: string): boolean {
    return (source ?? '').toLowerCase().includes(term);
  }

  private sortPublicacoes(items: Publicacao[]): Publicacao[] {
    return items.sort((a, b) => {
      const comparacao = this.valorOrdenacaoPublicacao(a, this.publicacoesSort).localeCompare(
        this.valorOrdenacaoPublicacao(b, this.publicacoesSort),
      );
      return this.publicacoesDir === 'DESC' ? -comparacao : comparacao;
    });
  }

  private valorOrdenacaoPublicacao(item: Publicacao, campo: string): string {
    switch (campo) {
      case 'cliente.nome':
        return item.clienteNome ?? '';
      case 'versao':
        return item.versao ?? '';
      case 'status':
        return item.status ?? '';
      case 'createdAt':
        return item.createdAt ?? '';
      default:
        return item.createdAt ?? '';
    }
  }
}
